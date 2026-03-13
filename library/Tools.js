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
  try {
    let tool = create(name, args, workspace);

    Log.oneline(tool.symbol, tool.toString());

    let output = await tool.call();
    if (output !== undefined)
      Log.detail(output);

    return output;
  } catch (error) {
    Log.detail(`${error}\n${JSON.stringify(args, 0, 2)}`);
    return typeof error.toJSON === "function" ? error : { error: String(error) };
  }
}
