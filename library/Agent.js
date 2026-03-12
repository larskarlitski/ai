import * as Log from "./Log.js";

import * as Anthropic from "./Anthropic.js";
import * as Gemini from "./Gemini.js";
import * as OpenAI from "./OpenAI.js";

import Edit from "./Edit.js";
import Execute from "./Execute.js";

let tools = { edit: Edit, execute: Execute };

async function callTool(name, args) {
  try {
    let cls = tools[name];
    if (cls === undefined)
      throw new Error(`Unknown tool: ${name}`);

    let tool = new cls(args);
    Log.oneline(tool.symbol, tool.toString());

    let output = await tool.call();
    if (output !== undefined)
      Log.detail(output);

    return output;
  } catch (error) {
    Log.detail(`${error}\n${JSON.stringify(args, 0, 2)}`);
    return typeof error.toJSON === "function" ? error : { error: String(error) };
  }
}

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
      tools: Object.values(tools).map(t => t.schema),
      callTool: callTool,
      message: text => Log.textBlock("⏵", text),
      baseURL: this.#baseURL
    });
  }
}
