import * as Transcript from "./Transcript.js";
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
  let t = create(name, args, workspace);
  let logResult = Transcript.tool(t.symbol, t.toString());

  let r = await t.call();
  logResult(r);

  return r;
}
