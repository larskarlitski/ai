import fs from "node:fs/promises";

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

  constructor(args) {
    if (typeof args !== "object" || args === null ||
        typeof args.path !== "string" ||
        (args.find !== undefined && typeof args.find !== "string") ||
        typeof args.replacement !== "string")
      throw new TypeError("Invalid arguments");

    this.#args = args;
  }

  toString() {
    return this.#args.path;
  }

  get symbol() {
    return this.#args.find ? "~" : "+";
  }

  async call() {
    let content;

    if (this.#args.find === undefined) {
      content = this.#args.replacement;
    } else {
      let string = await fs.readFile(this.#args.path, { encoding: "utf-8" });
      let start = string.indexOf(this.#args.find);
      if (start < 0)
        throw new Error("String not found");
      let end = start + this.#args.find.length;
      content = string.slice(0, start) + this.#args.replacement + string.slice(end);
    }

    let temp = `${this.#args.path}-${randomHexString(8)}`;
    await fs.writeFile(temp, content, { encoding: "utf-8" });
    await fs.rename(temp, this.#args.path);
  }
}
