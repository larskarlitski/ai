import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import * as Text from "./Text.js";
import * as TextTranscript from "./TextTranscript.js";

let newline = false;
let transcript = {
  entries: []
};

function printWrapped(marker, text, prose = false) {
  if (newline)
    console.log();

  let width = (process.stdout.columns ?? 80) - 4;
  let lines = String(text).split("\n");
  let wrapped = Text.wrapLines(lines, width, prose);
  let padded = Text.padLines(wrapped, 2, marker);

  console.log(padded.join("\n"));
  return padded.length;
}

export function start(session, prompt, meta) {
  Object.assign(transcript, { session, prompt });
  transcript.start = meta;

  let n = printWrapped("●", `${session}: ${meta.join(", ")}`);
  newline = true;
}

export function done(meta) {
  transcript.done = meta;

  printWrapped("■", meta.join(", "));
}

export function agent(text) {
  transcript.entries.push({ type: "agent", text });

  newline = true;
  printWrapped("⏵", text, true);
  newline = true;
}

export function tool(marker, text) {
  let entry = { type: "tool", marker, text }
  transcript.entries.push(entry);

  let n = printWrapped(marker, text);
  newline = n > 1;

  return result => entry.result = result;
}

export function error(e) {
  let message = e.stack ?? String(e);

  transcript.error = message;

  newline = true;
  printWrapped("✕", message);
  newline = true;
}

export async function save(filename) {
  let f = await fs.open(filename, "w");
  try {
    switch (path.extname(filename)) {
      case ".json":
        f.write(JSON.stringify(transcript, null, 2));
        break;
      default:
        TextTranscript.write(f, transcript, { width: 80 });
    }
  } finally {
    await f.close();
  }
}
