# Claude Code (TypeScript) – CodeCrafters Challenge

[![progress-banner](https://backend.codecrafters.io/progress/claude-code/f8f35ffb-8934-44c3-aa19-4d62a1bf4144)](https://app.codecrafters.io/users/zub-bee?r=2qF)

## For Hiring Managers

This repository documents my implementation work for the [CodeCrafters “Build Your Own Claude Code” challenge](https://codecrafters.io/challenges/claude-code).  
I built a command-line AI coding assistant in TypeScript that interacts with an OpenAI-compatible API and executes tool calls in an agent loop.

## What I Built

- A CLI entrypoint that accepts prompts (`-p`) and validates runtime inputs.
- Integration with OpenRouter via the OpenAI SDK.
- A multi-turn agent loop that:
  - sends conversation state to the model,
  - handles model tool calls,
  - executes local tools,
  - returns tool results back to the model until a final answer is produced.
- Three implemented tools:
  - **Read**: reads file contents from disk
  - **Write**: writes content to files
  - **Bash**: executes shell commands and returns output

## Skills Demonstrated

- TypeScript application development
- LLM API integration (OpenAI-compatible interface)
- JSON-schema-based tool definitions
- Tool-calling orchestration and agent-loop control flow
- Async programming and process/file-system integration in Node.js

## Key File

- `/app/main.ts` — core implementation of the assistant loop and tool execution.

## Running Locally

1. Set `OPENROUTER_API_KEY`.
2. (Optional) Set `OPENROUTER_BASE_URL` (defaults to `https://openrouter.ai/api/v1`).
3. Run:

```sh
./your_program.sh -p "your prompt here"
```
