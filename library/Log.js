import process from "node:process";
import * as TextWrap from "./TextWrap.js";

const margin = 2;
let last;

export function oneline(marker, text) {
  let width = (process.stdout.columns ?? 80) - 2 * margin;

  if (last === "detail" || last === "block")
    console.log();

  let ellipsis = "…";
  let newline = text.indexOf("\n");
  if (newline > 0 && newline < width)
    text = text.slice(0, newline);
  else if (text.length > width)
    text = text.slice(0, width);
  else
    ellipsis = "";

  console.log(`${marker.padEnd(margin)}${text}${ellipsis}`)

  last = "oneline";
}

export function block(marker, text) {
  let width = process.stdout.columns ?? 80;

  console.log();
  console.log(TextWrap.wrap(text, { marker, margin, width }));

  last = "block";
}

export function textBlock(marker, text) {
  let width = process.stdout.columns ?? 80;
  let prefixPatterns = [ "#+\\s+", "\\s*[*\\-]\\s+", "\\s*\\d+\\.\\s+" ];

  console.log();
  console.log(TextWrap.wrap(text, { marker, margin, width, prefixPatterns }));

  last = "block";
}

export function detail(text) {
  let width = process.stdout.columns ?? 80;

  console.log(TextWrap.wrap(text, { margin, width }));

  last = "detail";
}
