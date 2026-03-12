import process from "node:process";

export function get(name) {
  let secret = process.env[name];
  if (secret === undefined)
    throw new Error(`Missing environment variable: ${name}`);
  return secret;
}

