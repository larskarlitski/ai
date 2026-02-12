function systemMessageObject(content) {
  return { role: "system", content };
}

function userMessageObject(content) {
  return { role: "user", content };
}

function toolObject(tool) {
  let properties = {};
  if (Array.isArray(tool.arguments)) {
    for (let arg of tool.arguments)
      properties[arg.name] = { type: "string", description: arg.description }
  } else {
    properties[tool.arguments.name] = {
      type: "array",
      items: { type: "string" },
      description: tool.arguments.description
    };
  }

  return {
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: { type: "object", properties }
  };
}

function toolResultObject(id, result) {
  return {
    type: "function_call_output",
    call_id: id,
    output: JSON.stringify(result)
  };
}

function parseOutputMessage(output) {
  let messages = [];
  for (let item of output.content) {
    if (item.type === "output_text")
      messages.push(item.text);
    else
      throw new Error(`Unknown message type: ${item.type}`);
  }
  return messages.join("\n");
}

function parseOutputToolCall(output) {
  return {
    id: output.call_id,
    tool: output.name,
    arguments: JSON.parse(output.arguments)
  };
}

function parseResponseOutput(output) {
  let messages = [], toolCalls = [];

  for (let item of output) {
    switch (item.type) {
      case "message":
        messages.push(parseOutputMessage(item));
        break;

      case "reasoning":
        if (item.summary !== undefined)
          messages.push(item.summary.text);
        break;

      case "function_call":
        toolCalls.push(parseOutputToolCall(item));
        break;

      default:
        throw new Error(`Unknown output type: ${item.type}`);
    }
  }

  return { message: messages.join("\n"), toolCalls };
}

export class Session {
  #model;
  #url;
  #key;

  #tools;
  #previousResponseId;

  constructor(model, baseURL, credentialName) {
    this.#model = model;
    this.#url = `${baseURL ?? "https://api.openai.com/v1"}/responses`;
    this.#key = process.env[credentialName ?? "OPENAI_API_KEY"];
  }

  async start(instructions, prompt, tools) {
    this.#tools = tools.map(toolObject);

    let input = [];
    if (instructions !== undefined)
      input.push(systemMessageObject(instructions));
    input.push(...prompt.map(userMessageObject));

    return this.#request(input);
  }

  async turn(toolResults) {
    let input = [];
    for (let [ id, result ] of Object.entries(toolResults))
      input.push(toolResultObject(id, result));

    return this.#request(input);
  }

  async #request(input) {
    let r = await fetch(this.#url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.#key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.#model,
        tools: this.#tools,
        previous_response_id: this.#previousResponseId,
        input
      })
    });

    if (!r.ok)
      throw new Error(`Server returned ${r.status}: ${await r.text()}`);

    let response = await r.json();
    if (response.error)
      throw new Error(response.error.message ?? response.error);
    if (response.status !== "completed")
      throw new Error(`Model returned status ${response.status}`);

    this.#previousResponseId = response.id;

    return parseResponseOutput(response.output);
  }
}
