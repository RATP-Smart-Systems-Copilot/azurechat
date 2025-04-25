import { AI_NAME } from "@/features/theme/theme-config";
import { ChatCompletionStreamingRunner } from "openai/resources/beta/chat/completions";
import { CreateChatMessage } from "../chat-message-service";
import {
  AzureChatCompletion,
  AzureChatCompletionAbort,
  ChatThreadModel,
} from "../models";
import { ResponseStream } from "openai/lib/responses/ResponseStream.mjs";

export const OpenAIStream = (props: {
  runner: ResponseStream | ChatCompletionStreamingRunner;
  chatThread: ChatThreadModel;
}) => {
  const encoder = new TextEncoder();
  const { runner, chatThread } = props;
  let lastMessage = "";

  const readableStream = new ReadableStream({
    async start(controller) {
      const streamResponse = (event: string, value: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${value}\n\n`));
      };

      // Si le runner est un ResponseStream, on écoute les mises à jour par delta.
      if (runner instanceof ResponseStream) {
        runner.on("response.output_text.delta", (content) => {
          const response: AzureChatCompletion = {
            type: "content",
            response: content,
          };
          lastMessage += content.delta;
          streamResponse(response.type, JSON.stringify(response));
        })
        .on("response.output_text.done", async (content) => {
          await CreateChatMessage({
            name: AI_NAME,
            content: content.text,
            role: "assistant",
            chatThreadId: chatThread.id,
          });
          const response: AzureChatCompletion = {
            type: "finalContent",
            response: content,
          };
          streamResponse(response.type, JSON.stringify(response));
          controller.close();
        });
      }

      // Pour ChatCompletionStreamingRunner, on s'appuie sur l'événement "content".
      // L'événement "content" est ignoré pour ResponseStream (cas déjà traité)
      if (runner instanceof ChatCompletionStreamingRunner) {
        runner.on("content", (content) => {
          if (!(runner instanceof ResponseStream)) {
            const completion = runner.currentChatCompletionSnapshot;
            if (completion) {
              const response: AzureChatCompletion = {
                type: "content",
                response: completion,
              };
              lastMessage = completion.choices[0]?.message?.content ?? "";
              streamResponse(response.type, JSON.stringify(response));
            }
          }
        })
        .on("functionCall", async (functionCall) => {
          await CreateChatMessage({
            name: functionCall.name,
            content: functionCall.arguments,
            role: "function",
            chatThreadId: chatThread.id,
          });

          const response: AzureChatCompletion = {
            type: "functionCall",
            response: functionCall,
          };
          streamResponse(response.type, JSON.stringify(response));
        })
        .on("functionCallResult", async (functionCallResult) => {
          const response: AzureChatCompletion = {
            type: "functionCallResult",
            response: functionCallResult,
          };
          await CreateChatMessage({
            name: "tool",
            content: functionCallResult,
            role: "function",
            chatThreadId: chatThread.id,
          });
          streamResponse(response.type, JSON.stringify(response));
        })
        .on("abort", (error) => {
          const response: AzureChatCompletionAbort = {
            type: "abort",
            response: "Chat aborted",
          };
          streamResponse(response.type, JSON.stringify(response));
          controller.close();
        }).on("error", async (error) => {
          console.log("🔴 error", error);
          const response: AzureChatCompletion = {
            type: "error",
            response: error.message,
          };

          // Même en cas d'erreur, sauvegarder le dernier message (même incomplet)
          await CreateChatMessage({
            name: AI_NAME,
            content: lastMessage,
            role: "assistant",
            chatThreadId: chatThread.id,
          });

          streamResponse(response.type, JSON.stringify(response));
          controller.close();
        });
      }
    },
  });

  return readableStream;
};
