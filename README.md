# ai

A minimal, non-interactive coding agent.

    ai [--model MODEL] [--system PROMPT] PROMPT...

It supports OpenAI's GPT, Google's Gemini, and Anthropic's Claude models. Depending on which model
is requested, it expects OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY environment variables
to be set.

Runs a single agent loop:
- passes all prompts and optionally stdin to the model; the model receives no further input
- gives the model sandboxed (via bubblewrap) access to the current directory and allows it run any
  executable in /usr
