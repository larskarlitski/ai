import * as Log from "./Log.js";
import Edit from "./Edit.js";
import Execute from "./Execute.js";

export const schemas = Object.freeze([ Edit.schema, Execute.schema ]);

function create(name, args, workspace) {
  switch (name) {
    case "edit":
      return new Edit(args, workspace);
    case "execute":
      return new Execute(args, workspace);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function call(name, args, workspace) {
  let tool = create(name, args, workspace);
  Log.info(tool.symbol, tool.toString());
  return await tool.call();
}
