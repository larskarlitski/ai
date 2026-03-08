import child_process from "node:child_process";
import path from "node:path";
import util from "node:util";

let execFile = util.promisify(child_process.execFile);

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

export async function call({ args }) {
  let cwd = process.cwd();
  let name = path.basename(cwd);

  return await execFile("bwrap", [
    "--unshare-all",
    "--dev", "/dev",
    "--proc", "/proc",
    "--ro-bind", "/usr", "/usr",
    "--ro-bind", "/lib", "/lib",
    "--ro-bind", "/bin", "/bin",
    "--bind", cwd, `/${name}`,
    "--chdir", `/${name}`,
    ...args
  ]);
}

export function argsToString({ args }) {
  return args.map(
    a => /^[A-Za-z0-9._/-]+$/.test(a) ? a : JSON.stringify(a)
  ).join(" ");
}
