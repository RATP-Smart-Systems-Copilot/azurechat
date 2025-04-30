"use server";
import "server-only";

import { ChatThreadModel, UserPrompt } from "../models";
import { defaultMistralModel, MistralInstance } from "@/features/common/services/mistral";
import { CreateChatMessage, FindTopChatMessagesForCurrentUser } from "../chat-message-service";
import { mapAIInferenceChatMessages } from "../utils";
import { CHAT_DEFAULT_SYSTEM_PROMPT, modelOptions } from "@/features/theme/theme-config";
import { EnsureChatThreadOperation } from "../chat-thread-service";
import { getCurrentUser } from "@/features/auth-page/helpers";
import { LLMAIStream } from "./LLMAIStream";

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

export const ChatApiAIInference = async (props: UserPrompt, signal: AbortSignal) => {
    const currentChatThreadResponse = await EnsureChatThreadOperation(props.id);

    if (currentChatThreadResponse.status !== "OK") {
      return new Response("", { status: 401 });
    }

    const currentChatThread = currentChatThreadResponse.response;
    let selectedModel = modelOptions[currentChatThread.gptModel || defaultMistralModel];


       // promise all to get user, history and docs
    const [user, history] = await Promise.all([
      getCurrentUser(),
      _getHistory(currentChatThread)
    ]);

    // Starting values for system and user prompt
    // Note that the system message will also get prepended with the extension execution steps. Please see ChatApiExtensions method.
    currentChatThread.personaMessage = `${CHAT_DEFAULT_SYSTEM_PROMPT} \n\n ${currentChatThread.personaMessage}`;

    // save the user message
    await CreateChatMessage({
      name: user.name,
      content: props.message,
      role: "user",
      chatThreadId: currentChatThread.id,
      multiModalImage: props.multimodalImage,
    });


    const mistralAI = MistralInstance(currentChatThread.gptModel);
    const response = await mistralAI.path("/chat/completions")
    .post({
      body: {
        messages: [{
          role: "system",
          content: `${CHAT_DEFAULT_SYSTEM_PROMPT} \n\n ${currentChatThread.personaMessage}`,
          } ,
          ...history,
          {
          role: "user",
          content: props.message,
          }],
        stream: true,
        model: selectedModel.model,
        temperature: currentChatThread.personaTemperature,
      },
    })
    .asNodeStream();

    const stream = response.body;
    if (!stream) {
      throw new Error("The response stream is undefined");
    }
    if (response.status !== "200") {
      let errorBody = '';
      if(response.body){
        for await (const chunk of response.body) {
          errorBody += chunk.toString();
        }
      }

      throw new Error(`Failed to get chat completions: ${errorBody}`);
    }

    const readableStream = LLMAIStream({
      runner: stream,
      chatThread: currentChatThread,
    });

    return new Response(readableStream, {
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream"
      },
    });

};


