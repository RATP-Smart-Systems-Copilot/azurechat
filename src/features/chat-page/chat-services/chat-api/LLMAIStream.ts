import { AI_NAME } from "@/features/theme/theme-config";
import { CreateChatMessage } from "../chat-message-service";
import {
  AzureChatCompletion,
  AzureChatLLMCompletionContent,
  ChatThreadModel,
} from "../models";
import { createSseStream } from "@azure/core-sse";
import { uniqueId } from "@/features/common/util";

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
        const jsonResponse = JSON.parse(event.data);
        let idMessage = jsonResponse.id;
        for (const choice of jsonResponse.choices) {
          const content = choice.delta?.content;
          if (content !== undefined) {
            lastMessage += content;
          }

          const response: AzureChatLLMCompletionContent = {
            type: "contentLLM",
            response: lastMessage,
            idMessage: idMessage,
          };

          streamResponse(response.type, JSON.stringify(response));
        }
      }
    }
  });


  return readableStream;
};
