async function call(previousResponseId, input, options) {
  if (options.apiKey === undefined)
    throw new Error("Missing OPENAI_API_KEY");

  let tools = [];
  for (let tool of options.tools)
    tools.push({ type: "function", ...tool });

  let response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${options.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: options.model,
      previous_response_id: previousResponseId,
      tools,
      input
    })
  });

  if (!response.ok) {
    let text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  let reply = await response.json();
  if (reply.error)
    throw new Error(reply.error);
  if (reply.status !== "completed")
    throw new Error(`Model returned status ${reply.status}`);

  return reply;
}

async function run(prompt, options) {
  let input = [];
  for (let [ role, content ] of Object.entries(prompt))
    input.push(...content.map(c => ({ role, content: c })));

  if (input.length === 0)
    throw new TypeError("Invalid argument: prompt is empty");

  let messages = [];
  let tokens = 0;
  let previousResponseId = null;

  while (input.length !== 0) {
    let reply = await call(previousResponseId, input, options);

    input = [];
    for (let output of reply.output) {
      switch (output.type) {
        case "message":
          for (let item of output.content ?? []) {
            if (item.type === "output_text")
              options?.message(item.text);
            else
              throw new Error(`Unknown message type: ${item.type}`);
          }
          break;

        case "reasoning":
          // it's usually empty
          for (let summary of output.summary)
            options?.message(summary, { type: "reason" });
          break;

        case "function_call":
          input.push({
            type: "function_call_output",
            call_id: output.call_id,
            output: JSON.stringify(
              await options.callTool(output.name, JSON.parse(output.arguments))
            )
          });
          break;

        default:
          throw new Error(`Unknown output type: ${output.type}`);
      }
    }

    previousResponseId = reply.id;
    tokens += reply.usage.total_tokens;
  }

  return { tokens };
}

export default function(options) {
  return prompt => run(prompt, options);
}
