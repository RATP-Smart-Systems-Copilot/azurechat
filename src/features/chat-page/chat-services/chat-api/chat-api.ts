"use server";
import "server-only";

import { getCurrentUser } from "@/features/auth-page/helpers";
import { CHAT_DEFAULT_SYSTEM_PROMPT, modelOptions } from "@/features/theme/theme-config";
import { ChatCompletionStreamingRunner } from "openai/resources/beta/chat/completions";
import { ChatApiRAG } from "../chat-api/chat-api-rag";
import { FindAllChatDocuments, FindAllChatDocumentsByPersona } from "../chat-document-service";
import {
  CreateChatMessage,
  FindTopChatMessagesForCurrentUser,
} from "../chat-message-service";
import { EnsureChatThreadOperation } from "../chat-thread-service";
import { ChatThreadModel, UserPrompt } from "../models";
import { mapOpenAIChatMessages } from "../utils";
import { GetDefaultExtensions } from "./chat-api-default-extensions";
import { GetDynamicExtensions } from "./chat-api-dynamic-extensions";
import { ChatApiExtensions } from "./chat-api-extension";
import { ChatApiMultimodal } from "./chat-api-multimodal";
import { OpenAIStream } from "./open-ai-stream";
import { ChatApiSimple } from "./chat-api-simple";
import { ChatApiAIInference } from "./chat-api-ai-inference";
import { LLMAIStream } from "./LLMAIStream";
type ChatTypes = "extensions" | "chat-with-file" | "multimodal" | "simple" | "ai-inference";

export const ChatAPIEntry = async (props: UserPrompt, signal: AbortSignal) => {
  const currentChatThreadResponse = await EnsureChatThreadOperation(props.id);

  if (currentChatThreadResponse.status !== "OK") {
    return new Response("", { status: 401 });
  }

  const currentChatThread = currentChatThreadResponse.response;

   // promise all to get user, history and docs
   const [user, docs, docsPersona, extension] = await Promise.all([
    getCurrentUser(),
    _getDocuments(currentChatThread),
    _getDocumentsByPersona(currentChatThread),
    _getExtensions({
      chatThread: currentChatThread,
      userMessage: props.message,
      signal,
    }),
  ]);

   // save the user message
   await CreateChatMessage({
    name: user.name,
    content: props.message,
    role: "user",
    chatThreadId: currentChatThread.id,
    multiModalImage: props.multimodalImage,
  });

  let selectedModel = Object.values(modelOptions).find(model => model.model === currentChatThread.gptModel);

  if(selectedModel?.provider === 'MistralAI'){
    return llmInference(currentChatThread, props.message);
  }

  // promise all to get user, history and docs
  const history = await _getHistory(currentChatThread);
  // Starting values for system and user prompt
  // Note that the system message will also get prepended with the extension execution steps. Please see ChatApiExtensions method.
  currentChatThread.personaMessage = `${CHAT_DEFAULT_SYSTEM_PROMPT} \n\n ${currentChatThread.personaMessage}`;
  let chatType: ChatTypes = "extensions";

  if(currentChatThread.gptModel === process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_o1mini){
    chatType = "simple";
  }
  else if (props.multimodalImage && props.multimodalImage.length > 0) {
    chatType = "multimodal";
  } else if (docs.length > 0 || docsPersona.length > 0) {
    chatType = "chat-with-file";
  } else if (extension.length > 0) {
    chatType = "extensions";
  }

  let runner: ChatCompletionStreamingRunner;

  switch (chatType) {
    case "chat-with-file":
      runner = await ChatApiRAG({
        chatThread: currentChatThread,
        userMessage: props.message,
        history: history,
        signal: signal,
      });
      break;
    case "multimodal":
      runner = ChatApiMultimodal({
        chatThread: currentChatThread,
        userMessage: props.message,
        file: props.multimodalImage,
        signal: signal,
      });
      break;
    case "extensions":
      runner = await ChatApiExtensions({
        chatThread: currentChatThread,
        userMessage: props.message,
        history: history,
        extensions: extension,
        signal: signal,
      });
      break;
    case "simple":
      runner = await ChatApiSimple({
        chatThread: currentChatThread,
        userMessage: props.message,
        history: history,
        signal: signal,
      });
      break;
  }

  const readableStream = OpenAIStream({
    runner: runner,
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

const _getHistory = async (chatThread: ChatThreadModel) => {
  const historyResponse = await FindTopChatMessagesForCurrentUser(
    chatThread.id
  );

  if (historyResponse.status === "OK") {
    const historyResults = historyResponse.response;
    return mapOpenAIChatMessages(historyResults).reverse();
  }

  console.error("🔴 Error on getting history:", historyResponse.errors);

  return [];
};

const _getDocuments = async (chatThread: ChatThreadModel) => {
  const docsResponse = await FindAllChatDocuments(chatThread.id);

  const fixedChatThreadId = chatThread.name === "Confluence RSS" ? "GcOxmZJmTeRS4BbcgQIUO86VlCAdMRbuveKk" : "";

  if (docsResponse.status === "OK" && fixedChatThreadId === "")
    return docsResponse.response;

  if(docsResponse.status === "ERROR" && fixedChatThreadId === ""){
    console.error("🔴 Error on AI search:", docsResponse.errors);
    return [];
  }

  const docsResponseConfluence = await FindAllChatDocuments(fixedChatThreadId);

  if (docsResponse.status === "OK" && docsResponseConfluence.status === "OK") {
    return [...docsResponse.response, ...docsResponseConfluence.response];
  }

  if (docsResponse.status === "ERROR") {
    console.error("🔴 Error on AI search:", docsResponse.errors);
  }


  if (docsResponseConfluence.status === "ERROR") {
    console.error("🔴 Error on AI search:", docsResponseConfluence.errors);
  }

  return [];

};

const _getDocumentsByPersona = async (chatThread: ChatThreadModel) => {
  if(!chatThread.personaId)
    return [];

  const docsResponse = await FindAllChatDocumentsByPersona(chatThread.personaId);

  if (docsResponse.status === "OK") {
    return docsResponse.response;
  }

  console.error("🔴 Error on AI search:", docsResponse.errors);
  return [];
};

const _getExtensions = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  signal: AbortSignal;
}) => {
  const extension: Array<any> = [];

  const response = await GetDefaultExtensions({
    chatThread: props.chatThread,
    userMessage: props.userMessage,
    signal: props.signal,
  });
  if (response.status === "OK" && response.response.length > 0) {
    extension.push(...response.response);
  }

  const dynamicExtensionsResponse = await GetDynamicExtensions({
    extensionIds: props.chatThread.extension,
  });
  if (
    dynamicExtensionsResponse.status === "OK" &&
    dynamicExtensionsResponse.response.length > 0
  ) {
    extension.push(...dynamicExtensionsResponse.response);
  }

  return extension;
};

async function llmInference( currentChatThread : ChatThreadModel, UserMessage : string) {
  const response = await ChatApiAIInference({chatThread: currentChatThread, userMessage: UserMessage});
    const stream = response.body;
    if (!stream) {
      throw new Error("The response stream is undefined");
    }
    if (response.status !== "200") {
      throw new Error(`Failed to get chat completions`);
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
}

