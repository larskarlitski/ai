import process from "node:process";

const padding = 2;
let newline = false;

function wrapLines(lines, width) {
  let out = [];
  for (let line of lines) {
    let words = line.trim().split(/\s+/);

    if (words.length === 0) {
      out.push("");
      continue;
    }

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

    if (leading.length === 0 && words.length === 0) {
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
      out.push(line.slice(width - 1) + "…");
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

function printWrapped(marker, text, wrapper) {
  let lines = String(text).split("\n");
  let wrapped = wrapper(lines, (process.stdout.columns ?? 80) - 2 * padding);
  let padded = padLines(wrapped, padding, marker);

  console.log(padded.join("\n"));
  return padded.length;
}

export function info(marker, text) {
  if (newline)
    console.log();

  let n = printWrapped(marker, text, wrapLines);
  newline = n > 1;
}

export function prose(marker, text) {
  console.log();
  printWrapped(marker, text, wrapProseLines);
  newline = true;
}

export function error(marker, e) {
  let lines = e.stack.split("\n");
  let truncated = truncateLines(lines, (process.stdout.columns) - 2 * padding);
  let padded = padLines(truncated, padding, marker);

  if (newline)
    console.log();

  console.log(padded.join("\n"));
  newline = padded.length > 1;
}
