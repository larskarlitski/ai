import child_process from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";

let execFile = util.promisify(child_process.execFile);

async function git(...args) {
  let { stdout } = await execFile("git", args);
  return stdout.trim();
}

export function topLevel(repository) {
  return git("-C", repository, "rev-parse", "--show-toplevel");
}

async function listOneRemoteRef(repository, remote, ref) {
  let output = await git("-C", repository, "ls-remote", remote, ref);
  let [ head ] = output.split(/\s+/);
  return head;
}

export async function setupWorkspace(repository, directory) {
  await fs.mkdir(directory, { recursive: true });
  await git("clone", "--no-hardlinks", "--single-branch", repository, directory);
}

export async function teardownWorkspace(directory, options = {}) {
  let branch;

  if (options.pushChanges) {
    let changed = false;

    let status = await git("-C", directory, "status", "--porcelain");
    if (status.length > 0) {
      await git("-C", directory, "add", "-A");
      await git("-C", directory, "commit", "-m", "Agent changes");
      changed = true;
    } else {
      let head = await git("-C", directory, "rev-parse", "HEAD");
      let remoteHead = await listOneRemoteRef(directory, "origin", "HEAD");
      changed = head !== remoteHead;
    }

    if (changed) {
      branch = `ai/${path.basename(directory)}`;
      await git("-C", directory, "push", "origin", `HEAD:refs/heads/${branch}`);
    }
  }

  await fs.rm(directory, { recursive: true, force: true });

  return branch;
}
