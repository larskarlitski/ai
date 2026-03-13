# ai – minimal, non-interactive coding agent

Runs a single agent loop: passes all prompts and optionally stdin to the model,
gives it sandboxed access to the current directory, and lets it run commands and
edit files until it considers itself to be done. The model receives no further
human input.

    ai [--model NAME] [--system PROMPT] [--system-file FILE]
       [--file FILE] [--base-url URL] [--workspace TYPE] PROMPT...

    Options:
      --model NAME        Model to use (default: gpt-5.2-codex)
      --system PROMPT     System prompt to pass to the model (can be repeated)
      --file FILE         Read an additional prompt from FILE (can be repeated)
      --system-file FILE  Read a system prompt from FILE (can be repeated)
      --base-url URL      Override the provider's API base URL
      --workspace TYPE    Create a writable workspace for the agent. Type must be "git".
                          Changes are pulled back into a branch.

      If stdin is not a terminal, its contents are appended to the user prompt.

## Sandboxing

All commands run in a sandbox, using [bubblewrap][] on Linux and `sandbox-exec`
on macOS.

By default, the sandbox gives the model read access to the current working
directory. With `--workspace=git`, that directory is cloned into a temporary
workspace. The agent can make changes there, which are pulled back into the main
repository (as branch `ai/{workspace-id}`) after it is done.

[bubblewrap]: https://github.com/containers/bubblewrap


## Supported models

It supports OpenAI, Google Gemini, and Anthropic models. The model prefix
determines the provider: `gpt-`, `gemini-`, and `claude-`, respectively.
