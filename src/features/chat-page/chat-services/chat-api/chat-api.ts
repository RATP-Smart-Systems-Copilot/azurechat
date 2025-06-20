"use server";
import "server-only";

import { getCurrentUser } from "@/features/auth-page/helpers";
import { CHAT_DEFAULT_SYSTEM_PROMPT } from "@/features/theme/theme-config";
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
import { GetDefaultExtensions, GetExportPPTExtensions } from "./chat-api-default-extensions";
import { GetDynamicExtensions } from "./chat-api-dynamic-extensions";
import { ChatApiExtensions } from "./chat-api-extension";
import { ChatApiMultimodal } from "./chat-api-multimodal";
import { OpenAIStream } from "./open-ai-stream";

type ChatTypes = "extensions" | "chat-with-file" | "multimodal" | "simple" | "ai-inference";
const PPT_EXTENSION = "PPT_EXTENSION";

export const ChatAPIEntry = async (props: UserPrompt, signal: AbortSignal) => {
  const currentChatThreadResponse = await EnsureChatThreadOperation(props.id);

  if (currentChatThreadResponse.status !== "OK") {
    return new Response("", { status: 401 });
  }

  const currentChatThread = currentChatThreadResponse.response;

   // promise all to get user, history and docs
   const [user, history, docs, docsPersona, extension] = await Promise.all([
    getCurrentUser(),
    _getHistory(currentChatThread),
    _getDocuments(currentChatThread),
    _getDocumentsByPersona(currentChatThread),
    _getExtensions({
      chatThread: currentChatThread,
      userMessage: props.message,
      signal,
    }),
  ]);

  // Starting values for system and user prompt
  // Note that the system message will also get prepended with the extension execution steps. Please see ChatApiExtensions method.
  currentChatThread.personaMessage = `${CHAT_DEFAULT_SYSTEM_PROMPT} \n\n ${currentChatThread.personaMessage}`;
  let chatType: ChatTypes = "extensions";

  if (props.multimodalImage && props.multimodalImage.length > 0) {
    chatType = "multimodal";
  } else if (docs.length > 0 || docsPersona.length > 0 || (currentChatThread.documentIds && currentChatThread.documentIds.length > 0)) {
    chatType = "chat-with-file";
  } else if (extension.length > 0) {
    chatType = "extensions";
  }

  // save the user message
  await CreateChatMessage({
    name: user.name,
    content: props.message,
    role: "user",
    chatThreadId: currentChatThread.id,
    multiModalImage: props.multimodalImage,
  });


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
      runner = await ChatApiMultimodal({
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
    let historyResults = historyResponse.response;
    if(chatThread.gptModel === process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_o3mini || chatThread.gptModel === "o4-mini"){
      historyResults = historyResults.filter((message) => message.role !== "function");
    }
    return mapOpenAIChatMessages(historyResults).reverse();
  }

  console.error("🔴 Error on getting history:", historyResponse.errors);

  return [];
};

const _getDocuments = async (chatThread: ChatThreadModel) => {
  const docsResponse = await FindAllChatDocuments(chatThread.id);

  if (docsResponse.status === "OK")
    return docsResponse.response;

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

  // Vérifier si PPT_EXTENSION est présent dans les extensions
  const hasPPT = props.chatThread.extension.includes(PPT_EXTENSION);

  // Appeler GetDefaultExtensions
  const response = await GetDefaultExtensions({
    chatThread: props.chatThread,
    userMessage: props.userMessage,
    signal: props.signal,
  });
  if (response.status === "OK" && response.response.length > 0) {
    extension.push(...response.response);
  }

  // Si PPT_EXTENSION est présent, appeler GetExportPPTExtensions
  if (hasPPT) {
    const pptResponse = await GetExportPPTExtensions({
      chatThread: props.chatThread,
      userMessage: props.userMessage,
      signal: props.signal,
    });
    if (pptResponse.status === "OK" && pptResponse.response.length > 0) {
      extension.push(...pptResponse.response);
    }

    // Retirer PPT_EXTENSION de la liste des extensions
    props.chatThread.extension = props.chatThread.extension.filter(ext => ext !== PPT_EXTENSION);
  }

  // Appeler GetDynamicExtensions avec les extensions restantes
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
