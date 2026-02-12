function userMessageObject(content) {
  return {
    role: "user",
    content
  };
}

function assistantMessageObject(content) {
  return {
    role: "assistant",
    content
  };
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
    name: tool.name,
    description: tool.description,
    input_schema: { type: "object", properties }
  };
}

function toolResultObject(id, result) {
  return {
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: id,
        content: result
      }
    ]
  };
}

function parseResponseContent(content) {
  let messages = [], toolCalls = [];

  for (let block of content) {
    switch (block.type) {
      case "text":
        messages.push(block.text);
        break;

      case "thinking":
        if (item.thinking !== undefined && item.thinking !== "")
          messages.push(item.thinking);
        break;

      case "tool_use":
        toolCalls.push({ id: block.id, tool: block.name, arguments: block.input });
        break;

      default:
        throw new Error(`Unknown content block: ${block.type}`);
    }
  }

  return { message: messages.join("\n"), toolCalls };
}

class Session {
  #url;
  #headers;
  #body;

  #instructions;
  #tools;
  #messages;

  constructor(url, headers, body) {
    this.#url = url;
    this.#headers = headers;
    this.#body = body;
  }

  async start(instructions, prompt, tools) {
    this.#instructions = instructions;
    this.#messages = prompt.map(userMessageObject);
    this.#tools = tools.map(toolObject);

    return this.#request();
  }

  async turn(toolResults) {
    for (let [ id, result ] of Object.entries(toolResults))
      this.#messages.push(toolResultObject(id, result));

    return this.#request();
  }

  async #request() {
    let r = await fetch(this.#url, {
      method: "POST",
      headers: this.#headers,
      body: JSON.stringify({
        system: this.#instructions,
        messages: this.#messages,
        tools: this.#tools,
        ...this.#body
      })
    });

    if (!r.ok)
      throw new Error(`Server returned ${r.status}: ${await r.text()}`);

    let response = await r.json();
    if (response.error)
      throw new Error(response.error.message ?? response.error);

    this.#messages.push(assistantMessageObject(response.content));

    return parseResponseContent(response.content);
  }
}

function messagesAPI(model, baseURL, credentialName) {
  let url = baseURL !== undefined ? `${baseURL}/messages` : "https://api.anthropic.com/v1/messages";

  let headers = {
    "content-type": "application/json",
    "x-api-key": process.env[credentialName ?? "ANTHROPIC_API_KEY"],
    "anthropic-version": "2023-06-01"
  };

  let body = {
    cache_control: { type: "ephemeral" },
    max_tokens: 4096,
    model
  };

  return [ url, headers, body ];
}

function vertexAPI(model, baseURL, credentialName) {
  let url = `${baseURL}/${model}:streamRawPredict`;

  let key = process.env[credentialName];
  let headers = {
    "content-type": "application/json",
    "authorization": `Bearer ${key}`
  };

  let body = {
    cache_control: { type: "ephemeral" },
    max_tokens: 4096,
    anthropic_version: "vertex-2023-10-16"
  };

  return [ url, headers, body ];
}

export class MessagesSession extends Session {
  constructor(model, baseURL, credentialName) {
    let [ url, headers, body ] = messagesAPI(model, baseURL, credentialName);
    super(url, headers, body);
  }
}

export class VertexSession extends Session {
  constructor(model, baseURL, credentialName) {
    let [ url, headers, body ] = vertexAPI(model, baseURL, credentialName);
    super(url, headers, body);
  }
}
