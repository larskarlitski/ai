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
    if (typeof args !== "object" || args === null ||
        typeof args.path !== "string" ||
        (args.find !== undefined && typeof args.find !== "string") ||
        typeof args.replacement !== "string")
      throw new TypeError("Invalid arguments");

    this.#args = args;
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
      throw new Error("Not allowed to edit files");

    let filepath = path.resolve(this.#workspace, this.#args.path);
    if (!filepath.startsWith(this.#workspace + "/"))
      throw new Error(`${filepath} is not below the current directory`);

    await fs.mkdir(path.dirname(filepath), { recursive: true });

    let content;
    if (this.#args.find === undefined) {
      content = this.#args.replacement;
    } else {
      let string = await fs.readFile(filepath, { encoding: "utf-8" });
      let start = string.indexOf(this.#args.find);
      if (start < 0)
        throw new Error("String not found");
      let end = start + this.#args.find.length;
      content = string.slice(0, start) + this.#args.replacement + string.slice(end);
    }

    let temp = `${filepath}-${randomHexString(8)}`;
    await fs.writeFile(temp, content, { encoding: "utf-8" });
    await fs.rename(temp, filepath);
  }
}
