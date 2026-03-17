const defaultBaseURL = "https://api.anthropic.com/";

function toolFromSchema(s) {
  return { name: s.name, description: s.description, input_schema: s.parameters };
}

export default class AnthropicSession {
  #input;
  #tools;
  #getSecret;
  #model;
  #baseURL;
  #tokens;

  constructor(prompt, { tools, getSecret, model, baseURL }) {
    this.#tools = tools;
    this.#getSecret = getSecret;
    this.#model = model;
    this.#baseURL = baseURL;
    this.#tokens = 0;

    let input = {};
    if (prompt.system !== undefined && prompt.system.length > 0)
      input.system = prompt.system.map(text => ({ type: "text", text }));

    if (prompt.user !== undefined && prompt.user.length !== 0)
      input.messages = prompt.user.map(content => ({ role: "user", content }));

    if (Object.keys(input).length === 0)
      throw new TypeError("Invalid argument: prompt is empty");

    this.#input = input;
  }

  get usage() {
    return { tokens: this.#tokens };
  }

  async #fetch() {
    let url = new URL("v1/messages", this.#baseURL ?? defaultBaseURL);
    let response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": this.#getSecret("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.#model,
        tools: this.#tools.map(toolFromSchema),
        ...this.#input,
        cache_control: { type: "ephemeral" },
        max_tokens: 4096
      })
    });

    let reply = await response.json();
    if (!response.ok || reply.error !== undefined)
      throw new Error(`Error (${response.status}): ${reply.error.message}`);

    return reply;
  }

  async call(toolResults = []) {
    for (let { id, result } of toolResults) {
      this.#input.messages.push({
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: id,
          content: JSON.stringify(result)
        }]
      });
    }

    let reply = await this.#fetch();
    this.#tokens += (reply.usage?.input_tokens ?? 0) + (reply.usage?.output_tokens ?? 0);

    if (reply.content === undefined || reply.content.length === 0)
      throw new Error("Model returned no content");

    let texts = [];
    let toolCalls = [];

    for (let block of reply.content) {
      this.#input.messages.push({ role: "assistant", content: [ block ] });

      switch (block.type) {
        case "text":
          texts.push(block.text.trim());
          break;

        case "tool_use":
          toolCalls.push({ id: block.id, name: block.name, args: block.input });
          break;

        default:
          throw new Error(`Unknown content block: ${block.type}`);
      }
    }

    return { texts, toolCalls };
  }
}
