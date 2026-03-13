import child_process from "node:child_process";
import os from "node:os";
import path from "node:path";
import process from "node:process";

function bwrap(argv, cwd, readOnly) {
  let bind = readOnly ? "--ro-bind" : "--bind";
  let name = path.basename(cwd);

  return [
    "bwrap",
    "--unshare-all",
    "--dev", "/dev",
    "--proc", "/proc",
    "--ro-bind", "/usr", "/usr",
    "--symlink", "usr/lib", "/lib",
    "--symlink", "usr/lib64", "/lib64",
    "--symlink", "usr/bin", "/bin",
    "--symlink", "usr/sbin", "/sbin",
    "--tmpfs", "/tmp",
    bind, cwd, `/${name}`,
    "--chdir", `/${name}`,
    "--",
    ...argv
  ];
}

function sandboxExec(argv, cwd, readOnly) {
  let allow = readOnly ? "file-read*" : "file-read* file-write*";
  let profile = `(version 1)
(deny default)
(allow process*)
(allow sysctl-read)
(allow mach-lookup)
(allow file-read*
  (literal "/")
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
(allow ${allow}
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
  let cmd = (process.platform === "darwin"
    ? sandboxExec(args, options.cwd, options.readOnly)
    : bwrap(args, options.cwd, options.readOnly)
  );

  let child = child_process.execFile(cmd[0], cmd.slice(1), (error, stdout, stderr) => {
    let code = 0;
    if (error) {
      if (typeof error.code !== "number") {
        reject(error);
        return;
      }
      code = error.code;
    }

    resolve({ code, stdout, stderr });
  });

  child.stdin.end(options.stdin);

  return promise;
}
