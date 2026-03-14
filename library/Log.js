import process from "node:process";
import TextLogger from "./TextLogger.js";

let loggers = [
  new TextLogger(process.stdout, {
    padding: 2,
    width: () => process.stdout.columns ?? 80
  })
];

export function info(marker, text) {
  loggers.forEach(l => l.info(marker, text));
}

export function prose(marker, text) {
  loggers.forEach(l => l.prose(marker, text));
}

export function error(marker, e) {
  loggers.forEach(l => l.error(marker, e));
}

export function detail(text) {
  loggers.forEach(l => l.detail(text));
}
