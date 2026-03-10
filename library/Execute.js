import * as Sandbox from "./Sandbox.js";

const schema = Object.freeze({
  name: "execute",
  description: "Executes a bash command inside a sandboxed environment",
  parameters: {
    type: "object",
    properties: {
      command: {
        description: "The command to execute (passed to `bash -c`)",
        type: "string"
      },
      stdin: {
        description: "Standard input for the command (optional)",
        type: "string"
      }
    }
  }
});

export default class Execute {
  static get schema() {
    return schema;
  }

  #args;

  constructor(args) {
    if (typeof args !== "object" || args === null ||
        typeof args.command !== "string" ||
        (args.stdin !== undefined && typeof args.stdin !== "string"))
      throw new TypeError("Invalid arguments");

    this.#args = args;
  }

  toString() {
    let s = this.#args.command;

    if (this.#args.stdin !== undefined)
      s += " (with stdin)";

    return s;
  }

  get symbol() {
    return "→";
  }

  call() {
    return Sandbox.execute([ "bash", "-c", this.#args.command ], { stdin: this.#args.stdin })
  }
}
