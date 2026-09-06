import OpenAI from "openai";
import { Messages } from "openai/resources/chat/completions.js";
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
    ],
  };

  let response = await client.chat.completions.create(input);

  if (!response.choices || response.choices.length === 0) {
    throw new Error("no choices in response");
  }

  while (response.choices[0]) {
    // You can use print statements as follows for debugging, they'll be visible when running tests.
    console.error("Logs from your program will appear here!");

    // TODO: Uncomment the lines below to pass the first stage

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
      messages.push(response.choices[0].message);
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
          console.log(fileContent);
          const result: OpenAI.ChatCompletionToolMessageParam = {
            role: "tool",
            tool_call_id: toolCall.id,
            content: fileContent,
          };
          messages.push(result);
        }
        response = await client.chat.completions.create(input);
      }
    }
  }
}

main();
