import fs from "node:fs/promises";
import process from "node:process";
import TextLogger from "./TextLogger.js";

let loggers = [
  new TextLogger(process.stdout, {
    padding: 2,
    width: () => process.stdout.columns ?? 80
  })
];

let transcriptFile;

export async function setup(transcript) {
  if (transcript !== undefined) {
    transcriptFile = await fs.open(transcript, "w");
    let logger = new TextLogger(transcriptFile, {
      withDetails: true,
      padding: 2,
      width: 80
    });
    loggers.push(logger);
  }
}

export function close() {
  loggers = [];
  return transcriptFile?.close();
}

export function info(marker, text) {
  loggers.forEach(l => l.info(marker, text));
}

export function prose(marker, text) {
  loggers.forEach(l => l.prose(marker, text));
}

export function detail(text) {
  loggers.forEach(l => l.detail(text));
}
