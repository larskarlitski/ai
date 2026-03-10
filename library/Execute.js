import * as Sandbox from "./Sandbox.js";

export const schema = Object.freeze({
  name: "execute",
  description: "Executes a command",
  parameters: {
    type: "object",
    properties: {
      command: {
        description: "The command to execute",
        type: "string"
      },
      stdin: {
        description: "Optional string to pass as standard input to the command",
        type: "string"
      }
    }
  }
});

function validateArgs(args) {
  return (
    typeof args === "object" &&
    args !== null &&
    typeof args.command === "string" &&
    (args.stdin === undefined || typeof args.stdin === "string")
  );
}

export function prepare(args) {
  if (!validateArgs(args))
    throw new TypeError(`Invalid arguments: ${args}`);

  return {
    message: args.stdin !== undefined ? `${args.command} (with stdin)` : args.command,
    call: () => Sandbox.execute([ "bash", "-c", args.command ], { stdin: args.stdin })
  };
}
