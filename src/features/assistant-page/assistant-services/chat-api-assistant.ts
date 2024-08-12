"use server";
import "server-only";

import { OpenAIAssistant, OpenAIInstance } from "@/features/common/services/openai";
import { FindExtensionByID } from "@/features/extensions-page/extension-services/extension-service";
import { RunnableToolFunction } from "openai/lib/RunnableFunction";
import { ChatCompletionStreamingRunner } from "openai/resources/beta/chat/completions";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ChatThreadModel } from "../../chat-page/chat-services/models";
import { Message } from "openai/resources/beta/threads/messages.mjs";
export const ChatApiAssistant = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  history: ChatCompletionMessageParam[];
  extensions: RunnableToolFunction<any>[];
  signal: AbortSignal;
}): Promise<Message[]> => {
  const { userMessage, history, signal, chatThread, extensions } = props;

  const openAI = OpenAIAssistant();
  const threadIdAssistant = chatThread.threadAssistantID;
  const assistantID = chatThread.assistantID;
  const systemMessage = await extensionsSystemMessage(chatThread);

  // Add a Message to a Thread
  await openAI.beta.threads.messages.create(threadIdAssistant, {
    role: "user",
    content: userMessage,
  });

   // Run the Assistant
   const runResponse = await openAI.beta.threads.runs.create(threadIdAssistant, {
    assistant_id: assistantID,
  });

  // Check the Run status
  let run = await openAI.beta.threads.runs.retrieve(threadIdAssistant, runResponse.id);
  while (run.status !== "completed") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    run = await openAI.beta.threads.runs.retrieve(threadIdAssistant, runResponse.id);
  }
  
  const messagesResponse = await openAI.beta.threads.messages.list(threadIdAssistant);
  const assistantResponses = messagesResponse.data.filter(msg => msg.role === 'assistant');

  return assistantResponses;
};

const extensionsSystemMessage = async (chatThread: ChatThreadModel) => {
  let message = "";

  for (const e of chatThread.extension) {
    const extension = await FindExtensionByID(e);
    if (extension.status === "OK") {
      message += ` ${extension.response.executionSteps} \n`;
    }
  }

  return message;
};
