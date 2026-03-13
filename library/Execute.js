import process from "node:process";
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
  #workspace;
  #readOnly;

  constructor(args, workspace) {
    this.#args = args ?? {};

    if (workspace !== undefined) {
      this.#workspace = workspace;
      this.#readOnly = false;
    } else {
      this.#workspace = process.cwd();
      this.#readOnly = true;
    }
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

  async call() {
    if (typeof this.#args.command !== "string")
      return { error: "Invalid argument: command must be a string" };
    if (this.#args.stdin !== undefined && typeof this.#args.stdin !== "string")
      return { error: "Invalid argument: stdin must be a string" };

    let { code, stdout } = await Sandbox.execute(
      [ "bash", "-c", "exec 2>&1\n" + this.#args.command ],
      { cwd: this.#workspace, readOnly: this.#readOnly, stdin: this.#args.stdin }
    );

    let output = stdout.trim();
    if (code !== 0)
      output += `\nCommand exited with code ${code}`;

    return { output };
  }
}
