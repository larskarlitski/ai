import * as Anthropic from "./apis/Anthropic.js";
import * as GoogleGenerateContent from "./apis/GoogleGenerateContent.js";
import * as OpenAIResponses from "./apis/OpenAIResponses.js";

function get(api) {
  switch (api) {
    case "anthropic-messages":
      return Anthropic.MessagesSession;

    case "anthropic-vertex":
      return Anthropic.VertexSession;

    case "google-generate-content":
      return GoogleGenerateContent.Session;

    case "openai-responses":
      return OpenAIResponses.Session;

    default:
      throw new Error(`Unknown API: ${api}`);
  }
}

function getFromModel(model) {
  switch (model.split("-", 1)[0]) {
    case "claude":
      return Anthropic.MessagesSession;

    case "gemini":
      return GoogleGenerateContent.Session;

    case "gpt":
      return OpenAIResponses.Session;

    default:
      throw new Error(`No API known for model "${model}"`);
  }
}

export function createSession(name, model, baseURL, credentialName) {
  let Session = name !== undefined ? get(name) : getFromModel(model);

  return new Session(model, baseURL, credentialName);
}
