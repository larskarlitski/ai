import AnthropicSession from "./Anthropic.js";
import GeminiSession from "./Gemini.js";
import OpenAISession from "./OpenAI.js";
import * as Secret from "./Secret.js";
import * as Transcript from "./Transcript.js";
import * as Tools from "./Tools.js";

export default class Agent {
  #Session;
  #baseURL;
  #model;

  constructor(model, options) {
    this.#model = model

    if (model.startsWith("claude-"))
      this.#Session = AnthropicSession;
    else if (model.startsWith("gemini-"))
      this.#Session = GeminiSession;
    else if (model.startsWith("gpt-"))
      this.#Session = OpenAISession;
    else
      throw new Error(`Unknown model: ${model}`);

    this.#baseURL = options.baseURL;
  }

  async run(prompt, workspace) {
    let session = new this.#Session(prompt, {
      tools: Tools.schemas,
      getSecret: Secret.get,
      model: this.#model,
      baseURL: this.#baseURL
    });

    let toolResults = [];

    while (true) {
      let response = await session.call(toolResults);

      for (let text of response.texts)
        Transcript.agent(text);

      if (response.toolCalls.length === 0)
        break;

      toolResults = [];
      for (let call of response.toolCalls) {
        let result = await Tools.call(call.name, call.args, workspace);
        toolResults.push({ ...call, result });
      }
    }

    return session.usage;
  }
}
