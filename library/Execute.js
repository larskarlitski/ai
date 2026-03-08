import child_process from "node:child_process";
import path from "node:path";
import util from "node:util";

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

export function call({ args }) {
  let { promise, resolve, reject } = Promise.withResolvers();
  let cwd = process.cwd();
  let name = path.basename(cwd);
  let cmd = [
    "--unshare-all",
    "--dev", "/dev",
    "--proc", "/proc",
    "--ro-bind", "/usr", "/usr",
    "--ro-bind", "/lib", "/lib",
    "--ro-bind", "/bin", "/bin",
    "--bind", cwd, `/${name}`,
    "--chdir", `/${name}`,
    ...args
  ];

  let child = child_process.execFile("bwrap", cmd, (error, stdout, stderr) => {
    if (error)
      reject(error);
    else
      resolve({ stdout, stderr });
  });

  child.stdin.end();

  return promise;
}

export function argsToString({ args }) {
  return args.map(
    a => /^[A-Za-z0-9._/-]+$/.test(a) ? a : JSON.stringify(a)
  ).join(" ");
}
