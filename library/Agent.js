import * as TextWrap from "./TextWrap.js";

import * as Anthropic from "./Anthropic.js";
import * as Gemini from "./Gemini.js";
import * as OpenAI from "./OpenAI.js";

import Edit from "./Edit.js";
import Execute from "./Execute.js";

let providers = [ Anthropic, Gemini, OpenAI ];
let tools = { edit: Edit, execute: Execute };

function print(message, options = {}) {
  if (message === undefined) {
    console.log();
    return;
  }

  console.log(TextWrap.wrap(message, {
    width: process.stdout.columns ?? 80,
    margin: 2,
    ...options
  }));
}

function printModelMessage(text) {
  console.log();
  print(text, {
    marker: "⏵",
    prefixPatterns: [ "#+\\s+", "\\s*[*\\-]\\s+", "\\s*\\d+\\.\\s+" ]
  });
  console.log();
}

async function callTool(name, args) {
  let result;

  try {
    let cls = tools[name];
    if (cls === undefined)
      throw new Error(`Unknown tool: ${name}`);

    let tool = new cls(args);
    print(tool.toString(), { marker: tool.symbol });
    result = await tool.call();
  } catch (error) {
    print(String(error), { marker: "✘" });
    print(JSON.stringify(args, null, 2));
    print();
    result = typeof error.toJSON === "function" ? error : { error: String(error) };
  }

  return result;
}

export default class Agent {
  #provider;
  #baseURL;
  #model;

  constructor(model, options) {
    this.#model = model

    this.#provider = providers.find(p => model.startsWith(p.modelPrefix));
    if (this.#provider === undefined)
      throw new Error(`Unknown model: ${model}`);

    this.#baseURL = options.baseURL;
  }

  run(prompt) {
    return this.#provider.run(prompt, {
      model: this.#model,
      tools: Object.values(tools).map(t => t.schema),
      callTool: callTool,
      message: printModelMessage,
      baseURL: this.#baseURL
    });
  }
}
