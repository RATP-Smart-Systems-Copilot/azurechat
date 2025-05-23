"use server";
import "server-only";

import { OpenAIInstance } from "@/features/common/services/openai";
import { FindExtensionByID } from "@/features/extensions-page/extension-services/extension-service";
import { RunnableToolFunction } from "openai/lib/RunnableFunction";
import { ChatCompletionStreamingRunner } from "openai/resources/beta/chat/completions";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ChatThreadModel } from "../models";

const PPT_EXTENSION = "PPT_EXTENSION";

export const ChatApiExtensions = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  history: ChatCompletionMessageParam[];
  extensions: RunnableToolFunction<any>[];
  signal: AbortSignal;
}): Promise<ChatCompletionStreamingRunner> => {
  const { userMessage, history, signal, chatThread, extensions } = props;

  const openAI = OpenAIInstance(chatThread.gptModel);
  const systemMessage = await extensionsSystemMessage(chatThread);
  return openAI.beta.chat.completions.runTools(
    {
      model: "",
      stream: true,
      messages: [
        {
          role: "system",
          content: chatThread.personaMessage + "\n" + systemMessage,
        },
        ...history,
        {
          role: "user",
          content: userMessage,
        },
      ],
      tools: extensions,
      ...((chatThread.gptModel !== "o3-mini" && chatThread.gptModel !== "o4-mini") && { temperature: chatThread.personaTemperature }),
    },
    { signal: signal }
  );
};

const extensionsSystemMessage = async (chatThread: ChatThreadModel) => {
  let message = "";

  for (const e of chatThread.extension) {
     // Ignorer PPT_EXTENSION
    if (e === PPT_EXTENSION) {
      continue;
    }
    const extension = await FindExtensionByID(e);
    if (extension.status === "OK") {
      message += ` ${extension.response.executionSteps} \n`;
    }
  }

  return message;
};
