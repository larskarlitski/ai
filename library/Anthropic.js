import * as Log from "./Log.js";
import * as Secret from "./Secret.js";
import * as Tools from "./Tools.js";

const baseURL = "https://api.anthropic.com/";

function toolFromSchema(s) {
  return { name: s.name, description: s.description, input_schema: s.parameters };
}

async function call(input, options) {
  let url = new URL("v1/messages", options.baseURL ?? baseURL);
  let response = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": Secret.get("ANTHROPIC_API_KEY"),
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: options.model,
      tools: Tools.schemas.map(toolFromSchema),
      ...input,
      cache_control: { type: "ephemeral" },
      max_tokens: 4096
    })
  });

  let reply = await response.json();
  if (!response.ok || reply.error !== undefined)
    throw new Error(`Error (${response.status}): ${reply.error.message}`);

  return reply;
}

export async function run(prompt, options) {
  let input = {};
  if (prompt.system !== undefined && prompt.system.length > 0)
    input.system = prompt.system.map(text => ({ type: "text", text }));

  if (prompt.user !== undefined && prompt.user.length !== 0)
    input.messages = prompt.user.map(content => ({ role: "user", content }));

  if (Object.keys(input).length === 0)
    throw new TypeError("Invalid argument: prompt is empty");

  let tokens = 0;

  while (true) {
    let reply = await call(input, options);
    tokens += (reply.usage?.input_tokens ?? 0) + (reply.usage?.output_tokens ?? 0);
    if (reply.content === undefined || reply.content.length === 0)
      throw new Error("Model returned no content");

    let toolCalls = 0;
    for (let block of reply.content) {
      input.messages.push({ role: "assistant", content: [ block ] });
      switch (block.type) {
        case "text":
          Log.textBlock("⏵", block.text.trim());
          break;

        case "tool_use":
          toolCalls += 1;
          input.messages.push({
            role: "user",
            content: [{
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(
                await Tools.call(block.name, block.input)
              )
            }]
          });
          break;

        default:
          throw new Error(`Unknown content block: ${block.type}`);
      }
    }

    if (toolCalls === 0)
      break;
  }

  return { tokens };
}
