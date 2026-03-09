import child_process from "node:child_process";
import os from "node:os";
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

function bwrap(argv) {
  let cwd = process.cwd();
  let name = path.basename(cwd);

  return [
    "bwrap",
    "--unshare-all",
    "--dev", "/dev",
    "--proc", "/proc",
    "--ro-bind", "/usr", "/usr",
    "--ro-bind", "/lib", "/lib",
    "--ro-bind", "/bin", "/bin",
    "--bind", cwd, `/${name}`,
    "--chdir", `/${name}`,
    ...argv
  ];
}

function sandboxExec(argv) {
  let cwd = process.cwd();
  let profile = `(version 1)
(deny default)
(allow process*)
(allow sysctl-read)
(allow mach-lookup)
(allow file-read*
  (subpath "/usr")
  (subpath "/bin")
  (subpath "/dev")
  (subpath "/private/tmp")
  (subpath "/private/var/tmp")
  (subpath "/Library")
  (subpath "/System")
  (subpath "/opt/homebrew")
  (subpath "/Applications/Xcode.app")
  (subpath "/Applications/Xcode-beta.app")
  (subpath "${os.homedir()}/Library"))
(allow file-read* file-write*
  (subpath "${cwd}"))
`;

  return [
    "sandbox-exec",
    "-p", profile,
    ...argv
  ];
}

export function execute(args, options = {}) {
  let { promise, resolve, reject } = Promise.withResolvers();
  let cmd = process.platform === "darwin" ? sandboxExec(args) : bwrap(args);

  let child = child_process.execFile(cmd[0], cmd.slice(1), (error, stdout, stderr) => {
    if (error)
      reject(new ProcessFailedError(error.message, error.code, stdout, stderr));
    else
      resolve({ stdout, stderr });
  });

  if (options.stdin !== undefined)
    child.stdin.end(options.stdin);
  else
    child.stdin.end();

  return promise;
}
