import * as Sandbox from "./Sandbox.js";

const schema = Object.freeze({
  name: "execute",
  description: "Executes a command",
  parameters: {
    type: "object",
    properties: {
      command: {
        description: "The command to execute",
        type: "string"
      },
      stdin: {
        description: "Optional string to pass as standard input to the command",
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

  call() {
    return Sandbox.execute([ "bash", "-c", this.#args.command ], { stdin: this.#args.stdin })
  }
}
