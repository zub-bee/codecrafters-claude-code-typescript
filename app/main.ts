import OpenAI from "openai";
import { exec } from "node:child_process";
import { stderr, stdout } from "node:process";
const fs = await import("fs/promises");

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  // loop begin

  let messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "user", content: prompt },
  ];

  let input: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model: "anthropic/claude-haiku-4.5",
    messages: messages,
    tools: [
      {
        type: "function",
        function: {
          name: "Read",
          description: "Read and return the contents of a file",
          parameters: {
            type: "object",
            properties: {
              file_path: {
                type: "string",
                description: "The path to the file to read",
              },
            },
            required: ["file_path"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "Write",
          description: "Write content to a file",
          parameters: {
            type: "object",
            required: ["file_path", "content"],
            properties: {
              file_path: {
                type: "string",
                description: "The path of the file to write to",
              },
              content: {
                type: "string",
                description: "The content to write to the file",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "Bash",
          description: "Execute a shell command",
          parameters: {
            type: "object",
            required: ["command"],
            properties: {
              command: {
                type: "string",
                description: "The command to execute",
              },
            },
          },
        },
      },
    ],
  };

  while (true) {
    let response = await client.chat.completions.create(input);

    if (!response.choices || response.choices.length === 0) {
      throw new Error("no choices in response");
    }

    // You can use print statements as follows for debugging, they'll be visible when running tests.
    console.error("Logs from your program will appear here!");

    messages.push(response.choices[0].message);

    // if response has no tools
    if (
      !response.choices[0].message.tool_calls ||
      response.choices[0].message?.tool_calls.length === 0
    ) {
      console.log(response.choices[0].message.content);
      return;
    } else {
      // get tools call from response

      const toolCalls = response.choices[0].message.tool_calls;
      for (const toolCall of toolCalls) {
        const functionName =
          toolCall.type === "function" ? toolCall.function.name : undefined;
        const functionArgs =
          toolCall.type === "function"
            ? toolCall.function.arguments
            : undefined;
        if (functionName === "Read" && functionArgs) {
          const filePath = JSON.parse(functionArgs).file_path;
          const fileContent = await fs.readFile(filePath, "utf-8");
          const result: OpenAI.ChatCompletionToolMessageParam = {
            role: "tool",
            tool_call_id: toolCall.id,
            content: fileContent,
          };
          messages.push(result);
        }

        if (functionName === "Write" && functionArgs) {
          const filePath = JSON.parse(functionArgs).file_path;
          const fileContent = JSON.parse(functionArgs).content;

          await fs.writeFile(filePath, fileContent, "utf-8");

          const result: OpenAI.ChatCompletionToolMessageParam = {
            role: "tool",
            tool_call_id: toolCall.id,
            content: "file has been created successfully",
          };
          messages.push(result);
        }

        if (functionName === "Bash" && functionArgs) {
          const command = JSON.parse(functionArgs).command;

          const commandResult = await new Promise<string>((resolve) => {
            exec(command, (error, stdout, stderr) => {
              if (stderr) resolve(stderr);
              else if (stdout) resolve(stdout);
              else resolve(error?.message ?? "");
            });
          });

          const result: OpenAI.ChatCompletionToolMessageParam = {
            role: "tool",
            tool_call_id: toolCall.id,
            content: commandResult,
          };
          messages.push(result);
        }
      }
    }
  }
}

main();
