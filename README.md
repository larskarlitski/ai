# ai

A minimal, non-interactive coding agent.

    OPENAI_API_KEY=... ai [--system PROMPT] PROMPT...

Runs a single agent loop:
- passes all prompts and optionally stdin to the model; the model receives no further input
- gives the model sandboxed (via bubblewrap) access to the current directory and allows it run any
  executable in /usr
