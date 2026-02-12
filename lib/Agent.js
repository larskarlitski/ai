import child_process from "node:child_process";
import fs from "node:fs/promises";
import util from "node:util";

let execFile = util.promisify(child_process.execFile);

async function readdir(path) {
  try {
    return await fs.readdir(path);
  } catch (error) {
    if (error.code === "ENOENT")
      return [];
    throw error;
  }
}

export async function load(directory) {
  let config = JSON.parse(
    await fs.readFile(`${directory}/config.json`, "utf8")
  );

  let agent = {
    directory,
    model: config.model,
    api: config.api,
    baseURL: (typeof config.baseURL === "string"
      ? config.baseURL.replace(/\/+$/, "")
      : undefined
    ),
    credentialName: config.credentialName,
    tools: {}
  }

  try {
    agent.instructions = await fs.readFile(`${directory}/instructions.md`, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT")
      throw error;
  }

  for (let name of await readdir(`${directory}/tools`)) {
    try {
      let path = `${directory}/tools/${name}`;
      let { stdout } = await execFile(path, [ "--tool" ]);
      agent.tools[name] = { ...JSON.parse(stdout), path };
    } catch (error) {
      if (error.code !== "EACCES") // ignore non-executable files
        throw error;
    }
  }

  return agent;
}

export async function runTool(tool, args) {
  let argv;

  if (Array.isArray(tool.arguments))
    argv = tool.arguments.map(a => args[a.name]);
  else
    argv = args[tool.arguments.name];

  let { stdout } = await execFile(tool.path, argv);
  return stdout;
}
