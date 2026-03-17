const defaultBaseURL = "https://generativelanguage.googleapis.com/";

export default class GeminiSession {
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
      input.system_instruction = { parts: prompt.system.map(text => ({ text })) };
    if (prompt.user !== undefined)
      input.contents = [ { parts: prompt.user.map(text => ({ text })) } ];

    if (Object.keys(input).length === 0)
      throw new TypeError("Invalid argument: prompt is empty");

    this.#input = input;
  }

  get usage() {
    return { tokens: this.#tokens };
  }

  async #fetch() {
    let url = new URL(`v1beta/models/${this.#model}:generateContent`, this.#baseURL ?? defaultBaseURL);
    url.searchParams.set("key", this.#getSecret("GEMINI_API_KEY"));

    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...this.#input,
        generationConfig: { candidateCount: 1 },
        tools: [ { functionDeclarations: this.#tools } ],
        toolConfig: { functionCallingConfig: { mode: "AUTO" } }
      })
    });

    if (!response.ok) {
      let text = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${text}`);
    }

    let reply = await response.json();
    if (reply.error)
      throw new Error(reply.error);

    return reply;
  }

  async call(toolResults = []) {
    for (let { name, result } of toolResults) {
      this.#input.contents.push({
        role: "user",
        parts: [{
          functionResponse: {
            name,
            response: { result: JSON.stringify(result) }
          }
        }]
      });
    }

    let reply = await this.#fetch();
    this.#tokens += reply.usageMetadata?.totalTokenCount ?? 0;

    let candidate = reply.candidates?.[0];
    if (candidate === undefined)
      throw new Error("Model returned no candidates");

    let parts = candidate.content?.parts;
    if (parts === undefined || parts.length === 0)
      throw new Error("Model returned empty content");

    let texts = [];
    let toolCalls = [];

    for (let part of parts) {
      this.#input.contents.push({ role: "model", parts: [ part ] });

      if (part.text !== undefined) {
        texts.push(part.text);
      } else if (part.functionCall !== undefined) {
        toolCalls.push({ name: part.functionCall.name, args: part.functionCall.args });
      } else {
        throw new Error("Unknown Gemini part type");
      }
    }

    return { texts, toolCalls };
  }
}
