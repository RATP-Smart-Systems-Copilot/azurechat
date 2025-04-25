"use server";
import "server-only";

import { OpenAIInstance } from "@/features/common/services/openai";
import { FindExtensionByID } from "@/features/extensions-page/extension-services/extension-service";
import { RunnableToolFunction } from "openai/lib/RunnableFunction";
import { ChatCompletionStreamingRunner } from "openai/resources/beta/chat/completions";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ChatThreadModel } from "../models";
import { ResponseStream } from "openai/lib/responses/ResponseStream.mjs";
import { Tool } from "openai/resources/responses/responses.mjs";

export const ChatApiExtensions = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  history: any;
  extensions: Array<Tool>;
  signal: AbortSignal;
}) : Promise<ResponseStream> => {
  const { userMessage, history, signal, chatThread, extensions } = props;

  const openAI = OpenAIInstance(chatThread.gptModel);
  const systemMessage = await extensionsSystemMessage(chatThread);
  return openAI.responses.stream(
    {
      model: chatThread.gptModel ?? "gpt-4.1-mini",
      stream: true,
      instructions: chatThread.personaMessage + "\n" + systemMessage,
      input: [
        ...history,
        {
          role: "user",
          content: userMessage,
        },
      ],
      tool_choice: "auto",
      tools: extensions,
      ...(chatThread.gptModel !== "o3-mini" && { temperature: chatThread.personaTemperature }),
      max_output_tokens: 25000,
      ...(chatThread.gptModel == "o3-mini" && { reasoning: {
        effort: "medium", // unchanged
        summary: "auto" // auto gives you the best available summary (detailed > auto > None)
      } }),
    },
    { signal: signal }
  );
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
