"use server";
import "server-only";

import { ChatThreadModel } from "../models";
import { MistralInstance } from "@/features/common/services/mistral";
import { FindTopChatMessagesForCurrentUser } from "../chat-message-service";
import { mapAIInferenceChatMessages } from "../utils";
import { CHAT_DEFAULT_SYSTEM_PROMPT } from "@/features/theme/theme-config";
import { FindExtensionByID } from "@/features/extensions-page/extension-services/extension-service";
import { RunnableToolFunction } from "openai/lib/RunnableFunction.mjs";
import { GetDynamicExtensionsForLLM } from "./chat-api-dynamic-extensions";
import { ChatCompletionsToolDefinition } from "@azure-rest/ai-inference";

const _getHistory = async (chatThread: ChatThreadModel) => {
  const historyResponse = await FindTopChatMessagesForCurrentUser(
    chatThread.id
  );

  if (historyResponse.status === "OK") {
    const historyResults = historyResponse.response;
    return mapAIInferenceChatMessages(historyResults).reverse();
  }

  console.error("🔴 Error on getting history:", historyResponse.errors);

  return [];
};

export const ChatApiAIInference = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  signal: AbortSignal;
}) => {
    const { userMessage, chatThread } = props;
    const [history] = await Promise.all(
      [
        _getHistory(chatThread),
      ]);


    const mistralAI = MistralInstance(chatThread.gptModel);
    return await mistralAI.path("/chat/completions")
    .post({
      body: {
        messages: [{
          role: "system",
          content: `${CHAT_DEFAULT_SYSTEM_PROMPT} \n\n ${chatThread.personaMessage}`,
          } ,
          ...history,
          {
          role: "user",
          content: userMessage,
          }],
        stream: true,
        model: chatThread.gptModel,
        temperature: chatThread.personaTemperature,
      },
    })
    .asNodeStream();

};


