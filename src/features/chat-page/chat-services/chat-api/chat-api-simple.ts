"use server";
import "server-only";

import { OpenAIInstance } from "@/features/common/services/openai";
import { ChatCompletionStreamingRunner } from "openai/resources/beta/chat/completions";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ChatThreadModel } from "../models";
export const ChatApiSimple = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  history: ChatCompletionMessageParam[];
  signal: AbortSignal;
}): Promise<ChatCompletionStreamingRunner> => {
  const { userMessage, history, signal, chatThread } = props;

  const openAI = OpenAIInstance(chatThread.gptModel);
  return openAI.beta.chat.completions.stream(
    {
      model: "",
      stream: true,
      messages: [
        ...history,
        {
          role: "user",
          content: userMessage,
        },
      ],
    },
    { signal: signal }
  );
};
