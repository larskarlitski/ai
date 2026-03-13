import * as Anthropic from "./Anthropic.js";
import * as Gemini from "./Gemini.js";
import * as OpenAI from "./OpenAI.js";

export default class Agent {
  #provider;
  #baseURL;
  #model;

  constructor(model, options) {
    this.#model = model

    if (model.startsWith("claude-"))
      this.#provider = Anthropic;
    else if (model.startsWith("gemini-"))
      this.#provider = Gemini;
    else if (model.startsWith("gpt-"))
      this.#provider = OpenAI;
    else
      throw new Error(`Unknown model: ${model}`);

    this.#baseURL = options.baseURL;
  }

  run(prompt) {
    return this.#provider.run(prompt, {
      model: this.#model,
      baseURL: this.#baseURL
    });
  }
}
