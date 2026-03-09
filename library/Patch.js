import * as Sandbox from "./Sandbox.js";

export const schema = Object.freeze({
  name: "patch",
  description:
    "Applies a unified diff (patch) to files in the current directory. " +
    "The patch should be in unified diff format as produced by `diff -u` or `git diff`. " +
    "Each file's diff must include a proper `--- a/path` and `+++ b/path` header. " +
    "Context lines must match the existing file content exactly.",
  parameters: {
    type: "object",
    properties: {
      patch: {
        type: "string",
        description:
          "The unified diff content to apply. Use `--- a/file` and `+++ b/file` headers " +
          "and standard `@@ -start,count +start,count @@` hunk headers."
      }
    },
    required: ["patch"]
  }
});

export function validateArgs(args) {
  return (
    typeof args === "object" && args !== null &&
    typeof args.patch === "string"
  );
}

export function call({ patch }) {
  return Sandbox.execute([
    "patch",
    "--strip=1",       // strip leading a/ b/ path components
    "--unified",       // expect unified diff format
    "--fuzz=2",        // allow some fuzz for imprecise context lines
    "--batch"          // non-interactive: never prompt
  ], { stdin: patch });
}

export function argsToString({ patch }) {
  let lines = patch.split("\n");
  let files = lines
    .filter(l => l.startsWith("+++ "))
    .map(l => l.replace(/^\+\+\+ [ab]\//, ""));

  let added = lines.filter(l => l.startsWith("+") && !l.startsWith("+++")).length;
  let removed = lines.filter(l => l.startsWith("-") && !l.startsWith("---")).length;

  return `${files.join(", ")} (+${added} -${removed} lines)`;
}
