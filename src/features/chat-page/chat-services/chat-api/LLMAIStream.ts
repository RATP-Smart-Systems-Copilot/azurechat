import { AI_NAME } from "@/features/theme/theme-config";
import { CreateChatMessage } from "../chat-message-service";
import {
  AzureChatCompletion,
  AzureChatLLMCompletionContent,
  ChatThreadModel,
} from "../models";
import { createSseStream } from "@azure/core-sse";

export const LLMAIStream = (props: {
  runner: any;
  chatThread: ChatThreadModel;
}) => {
  const encoder = new TextEncoder();
  const { runner, chatThread } = props;

  const readableStream = new ReadableStream({
    async start(controller) {
      const streamResponse = (event: string, value: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${value}\n\n`));
      };

      let lastMessage = "";

      const sses = createSseStream(runner);

      for await (const event of sses) {
        if (event.data === "[DONE]") {
          await CreateChatMessage({
            name: AI_NAME,
            content: lastMessage,
            role: "assistant",
            chatThreadId: props.chatThread.id,
          });

          const response: AzureChatCompletion = {
            type: "finalContent",
            response: lastMessage,
          };
          streamResponse(response.type, JSON.stringify(response));
          controller.close();
          continue;
        }
        for (const choice of JSON.parse(event.data).choices) {
          const content = choice.delta?.content;
          if (content !== undefined) {
            lastMessage += content;
          }
          const response: AzureChatLLMCompletionContent = {
            type: "contentLLM",
            response: lastMessage,
            idMessage: choice.id,
          };

          streamResponse(response.type, JSON.stringify(response));
        }
      }
    }
  });


  return readableStream;
};
