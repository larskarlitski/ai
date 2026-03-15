import fs from "node:fs/promises";
import path from "node:path";

const schema = Object.freeze({
  name: "edit",
  description: "Edit or create a text file",
  parameters: {
    type: "object",
    properties: {
      path: {
        description: "Path to the file",
        type: "string"
      },
      find: {
        description: "Exact string to find and replace the first occurence of " +
                     "(optional; file is created or replaced completely if not given)",
        type: "string"
      },
      replacement: {
        description: "String which replaces `string`, or the full file contents",
        type: "string"
      }
    },
    required: [ "path", "replacement" ]
  }
});

function randomHexString(n) {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(n)),
    b => b.toString(16).padStart(2, "0")
  ).join("");
}

export default class Edit {
  static get schema() {
    return schema;
  }

  #args;
  #workspace;

  constructor(args, workspace) {
    this.#args = args ?? {};
    this.#workspace = workspace;
  }

  toString() {
    let op = this.#args.find ? "Edit" : "Create";
    return `${op} ${this.#args.path}`;
  }

  get symbol() {
    return this.#args.find ? "~" : "+";
  }

  async call() {
    if (this.#workspace === undefined)
      return { error: "Not allowed to edit files" };
    if (typeof this.#args.path !== "string")
      return { error: "Invalid argument: path must be a string" };
    if (this.#args.find !== undefined && typeof this.#args.find !== "string")
      return { error: "Invalid argument: find must be a string" };
    if (typeof this.#args.replacement !== "string")
      return { error: "Invalid argument: replacement must be a string" };

    let filepath = path.resolve(this.#workspace, this.#args.path);
    if (!filepath.startsWith(this.#workspace + "/"))
      return { error: `${filepath} is not below the current directory` };

    await fs.mkdir(path.dirname(filepath), { recursive: true });

    let stat;
    try {
      stat = await fs.stat(filepath);
    } catch (e) {}

    let content;
    if (this.#args.find === undefined) {
      content = this.#args.replacement;
    } else {
      let string = await fs.readFile(filepath, { encoding: "utf-8" });
      let start = string.indexOf(this.#args.find);
      if (start < 0)
        return { error: "String not found" };
      let end = start + this.#args.find.length;
      content = string.slice(0, start) + this.#args.replacement + string.slice(end);
    }

    let temp = `${filepath}-${randomHexString(8)}`;
    await fs.writeFile(temp, content, { encoding: "utf-8", mode: stat?.mode });
    await fs.rename(temp, filepath);

    return {};
  }
}
