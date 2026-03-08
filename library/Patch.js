import child_process from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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

export function call({ patch }) {
  let { promise, resolve, reject } = Promise.withResolvers();
  let cwd = process.cwd();
  let name = path.basename(cwd);

  // Write the patch to a temporary file so we can feed it to `patch` inside
  // the sandbox.  The temp file is placed inside cwd so it is visible after
  // the bind-mount.
  let tmpName = `.patch-${process.pid}-${Date.now()}.tmp`;
  let tmpPath = path.join(cwd, tmpName);
  fs.writeFileSync(tmpPath, patch);

  let cmd = [
    "--unshare-all",
    "--dev", "/dev",
    "--proc", "/proc",
    "--ro-bind", "/usr", "/usr",
    "--ro-bind", "/lib", "/lib",
    "--ro-bind", "/bin", "/bin",
    "--bind", cwd, `/${name}`,
    "--chdir", `/${name}`,
    "patch",
    "--strip=1",       // strip leading a/ b/ path components
    "--unified",       // expect unified diff format
    "--fuzz=2",        // allow some fuzz for imprecise context lines
    "--batch",         // non-interactive: never prompt
    "--input", tmpName
  ];

  let child = child_process.execFile("bwrap", cmd, (error, stdout, stderr) => {
    // Clean up the temp file regardless of outcome
    try { fs.unlinkSync(tmpPath); } catch (_) {}

    if (error)
      reject(new Error(stdout + stderr));
    else
      resolve({ stdout, stderr });
  });

  child.stdin.end();

  return promise;
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
