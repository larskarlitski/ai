# ai – minimal, non-interactive coding agent

Runs a single agent loop: passes all prompts and optionally stdin to the model,
gives it sandboxed access to the current directory, and lets it run commands and
edit files until it considers itself to be done. The model receives no further
human input.

    ai [OPTIONS] PROMPT...

    Options:
          --transcript FILE   Save detailed transcript to FILE
      -m, --model NAME        Model to use (default: gpt-5.2-codex)
          --system PROMPT     System prompt to pass to the model (can be repeated)
      -f, --file FILE         Read an additional prompt from FILE (can be repeated)
          --system-file FILE  Read a system prompt from FILE (can be repeated)
          --base-url URL      Override the provider's API base URL
      -w, --workspace         Create a writable workspace for the agent using git.
                              Changes are pulled back into a branch.

      If stdin is not a terminal, its contents are appended to the user prompt.

## Sandboxing

All commands run in a sandbox, using [bubblewrap][] on Linux and `sandbox-exec`
on macOS.

By default, the sandbox gives the model read access to the current working
directory. If that directory is a git repository, pass `--workspace` to clone it
into a temporary, writable workspace. Any changes the agent makes are pulled
back into the main repository (as branch `ai/{workspace-id}`).

[bubblewrap]: https://github.com/containers/bubblewrap


## Supported models

It supports OpenAI, Google Gemini, and Anthropic models. The model prefix
determines the provider: `gpt-`, `gemini-`, and `claude-`, respectively.
