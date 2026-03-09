import bwrap from "./Bubblewrap.js";

export const schema = Object.freeze({
  name: "execute",
  description: "Executes a command",
  parameters: {
    type: "object",
    properties: {
      args: { type: "array", items: { type: "string" } },
      stdin: {
        type: "string",
        description: "Optional string to pass as standard input to the command"
      }
    }
  }
});

export function validateArgs(args) {
  return (
    typeof args === "object" && args !== null &&
    Array.isArray(args.args) && args.args.every(a => typeof a === "string") &&
    (args.stdin === undefined || typeof args.stdin === "string")
  );
}

export function call({ args, stdin }) {
  return bwrap(args, { stdin });
}

export function argsToString({ args, stdin }) {
  let cmd = args.map(
    a => /^[A-Za-z0-9._/-]+$/.test(a) ? a : JSON.stringify(a)
  ).join(" ");
  if (stdin !== undefined)
    cmd += " (with stdin)";
  return cmd;
}
