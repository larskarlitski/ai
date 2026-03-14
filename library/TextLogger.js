function wrapLines(lines, width) {
  let out = [];
  for (let line of lines) {
    let words = line.trim().split(/\s+/);

    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      let word = words[i];
      if (current.length + 1 + word.length <= width) {
        current += ` ${word}`;
      } else {
        out.push(current);
        current = word;
      }
    }
    out.push(current);
  }

  return out;
}

function wrapProseLines(lines, width) {
  let pattern = /^(\s*)((?:#+|[-*]|\d+\.) )?(.*)$/

  let out = [];
  for (let line of lines) {
    let m = line.match(pattern);
    let indent = m[1];
    let leading = m[2] ?? "";
    let words = m[3].trim().split(/\s+/);

    if (words.length === 1 && words[0] === "") {
      out.push("");
      continue;
    }

    let current = `${indent}${leading}${words[0]}`;
    for (let i = 1; i < words.length; i++) {
      let word = words[i];
      if (current.length + 1 + word.length <= width) {
        current += ` ${word}`;
      } else {
        out.push(current);
        current = `${indent}${"".padStart(leading.length)}${word}`;
      }
    }

    out.push(current);
  }

  return out;
}

function truncateLines(lines, width) {
  let out = [];

  for (let line of lines) {
    if (line.length <= width)
      out.push(line);
    else
      out.push(line.slice(0, width - 1) + "…");
  }

  return out;
}

function padLines(lines, padding, marker = "") {
  if (lines.length === 0)
    return [];

  let out = [ marker.padEnd(padding) + lines[0] ];

  for (let i = 1; i < lines.length; i++)
    out.push("".padEnd(padding) + lines[i]);

  return out;
}

export default class TextLogger {
  #out;
  #width;
  #padding;
  #withDetails;
  #newline = false;

  constructor(out, options = {}) {
    this.#out = out;
    this.#padding = options.padding ?? 2;
    this.#withDetails = options.withDetails ?? false;

    if (typeof options.width === "function")
      this.#width = options.width;
    else
      this.#width = () => Number(options.width ?? 80);
  }

  info(marker, text) {
    if (this.#newline)
      this.#out.write("\n");

    let n = this.#printWrapped(marker, text, wrapLines);
    this.#newline = n > 1;
  }

  prose(marker, text) {
    this.#out.write("\n");
    this.#printWrapped(marker, text, wrapProseLines);
    this.#newline = true;
  }

  detail(text) {
    if (!this.#withDetails)
      return;

    let lines = text.split("\n");
    let truncated = truncateLines(lines, this.#width() - 2 * this.#padding);
    let padded = padLines(truncated, this.#padding);
    this.#out.write(padded.join("\n") + "\n");
    this.#newline = true;
  }

  #printWrapped(marker, text, wrapper) {
    let lines = String(text).split("\n");
    let wrapped = wrapper(lines, this.#width() - 2 * this.#padding);
    let padded = padLines(wrapped, this.#padding, marker);

    this.#out.write(padded.join("\n") + "\n");
    return padded.length;
  }
}
