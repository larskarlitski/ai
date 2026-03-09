import child_process from "node:child_process";
import path from "node:path";

class ProcessFailedError extends Error {
  constructor(message, code, stdout, stderr) {
    super(message);
    this.code = code;
    this.stdout = stdout;
    this.stderr = stderr;
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      stdout: this.stdout,
      stderr: this.stderr
    };
  }
}

export default function (args, options = {}) {
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
      reject(new ProcessFailedError(error.message, error.code, stdout, stderr));
    else
      resolve({ stdout, stderr });
  });

  child.stdin.end();

  return promise;
}
