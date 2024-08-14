import { AI_NAME } from "@/features/theme/theme-config";
import { ChatCompletionStreamingRunner } from "openai/resources/beta/chat/completions";
import { CreateChatMessage } from "../chat-message-service";
import {
  AzureChatCompletion,
  AzureChatCompletionAbort,
  ChatThreadModel,
} from "../models";
import { AssistantStream } from "openai/lib/AssistantStream.mjs";
import { OpenAIAssistant } from "@/features/common/services/openai";
import { ConsoleLoggingListener } from "microsoft-cognitiveservices-speech-sdk/distrib/lib/src/common.browser/ConsoleLoggingListener";

export const OpenAIStream = (props: {
  runner: ChatCompletionStreamingRunner;
  chatThread: ChatThreadModel;
}) => {
  const encoder = new TextEncoder();

  const { runner, chatThread } = props;

  const readableStream = new ReadableStream({
    async start(controller) {
      const streamResponse = (event: string, value: string) => {
        controller.enqueue(encoder.encode(`event: ${event} \n`));
        controller.enqueue(encoder.encode(`data: ${value} \n\n`));
      };

      let lastMessage = "";

      runner
        .on("content", (content) => {
          const completion = runner.currentChatCompletionSnapshot;
          if (completion) {
            const response: AzureChatCompletion = {
              type: "content",
              response: completion,
            };
            lastMessage = completion.choices[0].message.content ?? "";
            streamResponse(response.type, JSON.stringify(response));
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
        })
        .on("error", async (error) => {
          console.log("🔴 error", error);
          const response: AzureChatCompletion = {
            type: "error",
            response: error.message,
          };

          // if there is an error still save the last message even though it is not complete
          await CreateChatMessage({
            name: AI_NAME,
            content: lastMessage,
            role: "assistant",
            chatThreadId: props.chatThread.id,
          });

          streamResponse(response.type, JSON.stringify(response));
          controller.close();
        })
        .on("finalContent", async (content: string) => {
          await CreateChatMessage({
            name: AI_NAME,
            content: content,
            role: "assistant",
            chatThreadId: props.chatThread.id,
          });

          const response: AzureChatCompletion = {
            type: "finalContent",
            response: content,
          };
          streamResponse(response.type, JSON.stringify(response));
          controller.close();
        });
    },
  });

  return readableStream;
};

export const OpenAIStreamAssistant = (props: {
  runner: AssistantStream|undefined;
  chatThread: ChatThreadModel;
}) => {
  const encoder = new TextEncoder();
  const { runner, chatThread } = props;

  const readableStream = new ReadableStream({
    async start(controller) {
      const streamResponse = (event: string, value: string) => {
        controller.enqueue(encoder.encode(`event: ${event} \n`));
        controller.enqueue(encoder.encode(`data: ${value} \n\n`));
      };

      let is_completed = false
      let loop_count = 0
      let run_id

      while(!is_completed) {
          let stream = runner;
          let str = ''

          for await (const event of stream) {
              if(event.event === 'thread.message.delta') {
                  // the value of str is not used in particular,
                  // just to determine if there is already text generated
                  str += event.data.delta.content[0].text.value

                  controller.enqueue(event.data.delta.content[0].text.value)

              } else if(event.event === 'thread.message.completed'){
                const content = event.data;
                const message = event.data.content[0].text.value;
                await CreateChatMessage({
                  name: AI_NAME,
                  content: message,
                  role: "assistant",
                  chatThreadId: props.chatThread.id,
                });
                const response: AzureChatCompletion = {
                  type: "contentAssistant",
                  response: content,
                };
                streamResponse(response.type, JSON.stringify(response));
              }else if(event.event === 'thread.run.completed'){
                  is_completed = true
              }

          }

          if(str.length > 0 && !is_completed) {
              // just adding newline if this is invoked,
              // this is like showing, "please wait..."
              controller.enqueue(JSON.stringify({ longwait: true }))
          }

          loop_count++

      }
      controller.close()
  }

  });

  return readableStream;
};
