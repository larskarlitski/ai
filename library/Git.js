import child_process from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import util from "node:util";
import * as Log from "./Log.js";

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
  let workspace = await fs.mkdtemp(directory + "/");

  Log.info("↱", `Setting up workspace in ${workspace}`);
  await git("clone", "--no-hardlinks", "--single-branch", repository, workspace);

  return workspace;
}

export async function teardownWorkspace(workspace, options = {}) {
  if (options.pushChanges) {
    let branch = `ai/${path.basename(workspace)}`;
    let changed = false;

    let status = await git("-C", workspace, "status", "--porcelain");
    if (status.length > 0) {
      await git("-C", workspace, "add", "-A");
      await git("-C", workspace, "commit", "-m", "Agent changes");
      changed = true;
    } else {
      let head = await git("-C", workspace, "rev-parse", "HEAD");
      let remoteHead = await listOneRemoteRef(workspace, "origin", "HEAD");
      changed = head !== remoteHead;
    }

    if (changed) {
      Log.info("↳", `Import agent changes to ${branch}`);
      await git("-C", workspace, "push", "origin", `HEAD:refs/heads/${branch}`);
    } else {
      Log.info("↳", "Agent made no changes");
    }
  }

  await fs.rm(workspace, { recursive: true, force: true });
}
