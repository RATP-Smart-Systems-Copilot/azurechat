"use server";
import "server-only";

import { OpenAIAssistant, OpenAIInstance } from "@/features/common/services/openai";
import { FindExtensionByID } from "@/features/extensions-page/extension-services/extension-service";
import { RunnableToolFunction } from "openai/lib/RunnableFunction";
import { ChatCompletionStreamingRunner } from "openai/resources/beta/chat/completions";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ChatThreadModel } from "../../chat-page/chat-services/models";
import { Run } from "openai/resources/beta/threads/runs/runs.mjs";
import { AI_NAME } from "@/features/theme/theme-config";
import { CreateChatMessage } from "@/features/chat-page/chat-services/chat-message-service";
import { Message } from "openai/resources/beta/threads/messages.mjs";
import { run } from "node:test";

export const ChatApiAssistant = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  history: ChatCompletionMessageParam[];
  extensions: RunnableToolFunction<any>[];
  signal: AbortSignal;
}) => {
  const { userMessage, history, signal, chatThread, extensions } = props;

  const openAI = OpenAIAssistant();
  const threadIdAssistant = chatThread.threadAssistantID;
  const assistantID = chatThread.assistantID;
  try{

    // Add a Message to a Thread
    await openAI.beta.threads.messages.create(threadIdAssistant, {
      role: "user",
      content: userMessage,
    });

    // Run the thread and poll it until it is in a terminal state
    const runResponse = openAI.beta.threads.runs.stream(
      threadIdAssistant,
      {
          assistant_id: assistantID,
      }
    );

    return runResponse;
/*
    // Polling until the run completes or fails
    let runStatus = runResponse.status;
    while (runStatus === 'queued' || runStatus === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const runStatusResponse = await openAI.beta.threads.runs.retrieve(
          threadIdAssistant,
            runResponse.id
        );
        runStatus = runStatusResponse.status;
    }

    // Get the messages in the thread once the run has completed
    if (runStatus === 'completed') {
        const messagesResponse = await openAI.beta.threads.messages.list(
          threadIdAssistant
        );
         // Extraire le dernier message du thread
        const lastMessage = messagesResponse.data[0].content[0].text.value;
        await CreateChatMessage({
          name: AI_NAME,
          content: lastMessage,
          role: "assistant",
          chatThreadId: props.chatThread.id,
        });
    } else {
        console.log(`Run status is ${runStatus}, unable to fetch messages.`);
    }
*/
  } catch (error) {
      console.error(`Error running the assistant: ${error}`);
  }
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
