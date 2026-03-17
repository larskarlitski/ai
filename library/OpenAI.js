const defaultBaseURL = "https://api.openai.com/";

export default class OpenAISession {
  #input;
  #previousResponseId;
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
    this.#previousResponseId = null;
    this.#tokens = 0;

    let input = [];
    for (let [ role, content ] of Object.entries(prompt))
      input.push(...content.map(c => ({ role, content: c })));

    if (input.length === 0)
      throw new TypeError("Invalid argument: prompt is empty");

    this.#input = input;
  }

  get usage() {
    return { tokens: this.#tokens };
  }

  async #fetch() {
    let url = new URL("v1/responses", this.#baseURL ?? defaultBaseURL);
    let response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.#getSecret("OPENAI_API_KEY")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.#model,
        previous_response_id: this.#previousResponseId,
        tools: this.#tools.map(s => ({ type: "function", ...s })),
        input: this.#input
      })
    });

    if (!response.ok) {
      let text = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${text}`);
    }

    let reply = await response.json();
    if (reply.error)
      throw new Error(reply.error);
    if (reply.status !== "completed")
      throw new Error(`Model returned status ${reply.status}`);

    return reply;
  }

  async call(toolResults = []) {
    for (let { id, result } of toolResults) {
      this.#input.push({
        type: "function_call_output",
        call_id: id,
        output: JSON.stringify(result) ?? ""
      });
    }

    let reply = await this.#fetch();
    this.#tokens += reply.usage.total_tokens;

    this.#previousResponseId = reply.id;
    this.#input = [];

    let texts = [];
    let toolCalls = [];

    for (let output of reply.output) {
      switch (output.type) {
        case "message":
          for (let item of output.content ?? []) {
            if (item.type === "output_text")
              texts.push(item.text);
            else
              throw new Error(`Unknown message type: ${item.type}`);
          }
          break;

        case "reasoning":
          // it's usually empty
          for (let summary of output.summary)
            texts.push(summary);
          break;

        case "function_call":
          toolCalls.push({
            id: output.call_id,
            name: output.name,
            args: JSON.parse(output.arguments)
          });
          break;

        default:
          throw new Error(`Unknown output type: ${output.type}`);
      }
    }

    return { texts, toolCalls };
  }
}
