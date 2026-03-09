import bwrap from "./Bubblewrap.js";

export const schema = Object.freeze({
  name: "execute",
  description: "Executes a command",
  parameters: {
    type: "object",
    properties: {
      args: { type: "array", items: { type: "string" } }
    }
  }
});

export function validateArgs(args) {
  return (
    typeof args === "object" && args !== null &&
    Array.isArray(args.args) && args.args.every(a => typeof a === "string")
  );
}

export function call({ args }) {
  return bwrap(args);
}

export function argsToString({ args }) {
  return args.map(
    a => /^[A-Za-z0-9._/-]+$/.test(a) ? a : JSON.stringify(a)
  ).join(" ");
}
