function systemInstructionObject(content) {
  return {
    parts: [ { text: content } ]
  };
}

function userMessageObject(content) {
  return {
    role: "user",
    parts: [ { text: content } ]
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
    parameters: { type: "object", properties }
  };
}

function toolResultObject(id, result) {
  let colon = id.indexOf(":");

  return {
    functionResponse: {
      id: id.slice(colon + 1),
      name: id.slice(0, colon),
      response: { result: JSON.stringify(result) }
    }
  };
}

function parseResponseContent(content) {
  let messages = [], toolCalls = [];

  for (let part of content.parts) {
    if (part.text !== undefined) {
      messages.push(part.text);
    } else if (part.functionCall !== undefined) {
      toolCalls.push({
        id: `${part.functionCall.name}:${part.functionCall.id}`,
        tool: part.functionCall.name,
        arguments: part.functionCall.args ?? {}
      });
    } else {
      throw new Error("Unknown content part");
    }
  }

  return { message: messages.join("\n"), toolCalls };
}

export class Session {
  #url;

  #systemInstruction;
  #contents;
  #tools;

  constructor(model, baseURL, credentialName) {
    baseURL = baseURL ?? "https://generativelanguage.googleapis.com/v1beta/models";
    this.#url = new URL(`${baseURL}/${model}:generateContent`);
    this.#url.searchParams.set("key", process.env[credentialName ?? "GEMINI_API_KEY"]);
  }

  async start(instructions, prompt, tools) {
    if (instructions !== undefined)
      this.#systemInstruction = systemInstructionObject(instructions);
    this.#contents = prompt.map(userMessageObject);
    this.#tools = [ { functionDeclarations: tools.map(toolObject) } ];

    return this.#request();
  }

  async turn(toolResults) {
    let parts = [];
    for (let [ id, result ] of Object.entries(toolResults))
      parts.push(toolResultObject(id, result));

    if (parts.length > 0)
      this.#contents.push({ role: "user", parts });

    return this.#request();
  }

  async #request() {
    let r = await fetch(this.#url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: this.#systemInstruction,
        contents: this.#contents,
        tools: this.#tools,
        toolConfig: { functionCallingConfig: { mode: "AUTO" } }
      })
    });

    if (!r.ok)
      throw new Error(`Server returned ${r.status}: ${await r.text()}`);

    let response = await r.json();
    if (response.error)
      throw new Error(response.error.message ?? response.error);

    let content = response.candidates?.[0]?.content;
    if (!Array.isArray(content?.parts) || content.parts.length === 0)
      throw new Error("Model returned no content");

    this.#contents.push(content);

    return parseResponseContent(content);
  }
}
