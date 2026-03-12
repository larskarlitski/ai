import * as Secret from "./Secret.js";

export const modelPrefix = "gemini-";

const baseURL = "https://generativelanguage.googleapis.com/";

async function call(input, options) {
  let url = new URL(`v1beta/models/${options.model}:generateContent`, options.baseURL ?? baseURL);
  url.searchParams.set("key", Secret.get("GEMINI_API_KEY"));

  let response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      generationConfig: { candidateCount: 1 },
      tools: [ { functionDeclarations: options.tools } ],
      toolConfig: { functionCallingConfig: { mode: "AUTO" } }
    })
  });

  if (!response.ok) {
    let text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  let reply = await response.json();
  if (reply.error)
    throw new Error(reply.error);

  return reply;
}

export async function run(prompt, options) {
  let input = {};
  if (prompt.system !== undefined && prompt.system.length > 0)
    input.system_instruction = { parts: prompt.system.map(text => ({ text })) };
  if (prompt.user !== undefined)
    input.contents = [ { parts: prompt.user.map(text => ({ text })) } ];

  if (Object.keys(input).length === 0)
    throw new TypeError("Invalid argument: prompt is empty");

  let tokens = 0;

  while (true) {
    let reply = await call(input, options);
    tokens += reply.usageMetadata?.totalTokenCount ?? 0;

    let candidate = reply.candidates?.[0];
    if (candidate === undefined)
      throw new Error("Model returned no candidates");

    let parts = candidate.content?.parts;
    if (parts === undefined || parts.length === 0)
      throw new Error("Model returned empty content");

    let toolCalls = 0;

    for (let part of parts) {
      input.contents.push({ role: "model", parts: [ part ] });
      if (part.text !== undefined) {
        options.message(part.text);
      } else if (part.functionCall !== undefined) {
        toolCalls += 1;
        input.contents.push({
          role: "user",
          parts: [{
            functionResponse: {
              name: part.functionCall.name,
              response: {
                result: JSON.stringify(
                  await options.callTool(part.functionCall.name, part.functionCall.args)
                )
              }
            }
          }]
        });
      } else {
        throw new Error("Unknown Gemini part type");
      }
    }

    if (toolCalls === 0)
      break;
  }

  return { tokens };
}
