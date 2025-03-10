"use server";
import "server-only";

import { ChatThreadModel, UserPrompt } from "../models";
import { MistralInstance } from "@/features/common/services/mistral";
import { CreateChatMessage, FindTopChatMessagesForCurrentUser } from "../chat-message-service";
import { mapAIInferenceChatMessages } from "../utils";
import { CHAT_DEFAULT_SYSTEM_PROMPT } from "@/features/theme/theme-config";
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
        model: currentChatThread.gptModel,
        temperature: currentChatThread.personaTemperature,
      },
    })
    .asNodeStream();

    const stream = response.body;
    if (!stream) {
      throw new Error("The response stream is undefined");
    }
    if (response.status !== "200") {
      throw new Error(`Failed to get chat completions: ${await streamToString(stream)}`);
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

async function streamToString(stream: NodeJS.ReadableStream) {
  // lets have a ReadableStream as a stream variable
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf-8");
}


