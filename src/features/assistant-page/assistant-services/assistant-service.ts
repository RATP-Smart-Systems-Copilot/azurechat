"use server";
import "server-only";

import { OpenAIAssistant } from "@/features/common/services/openai";
import {
  ServerActionResponse,
  zodErrorsToServerActionErrors,
} from "@/features/common/server-action-response";
import { CursorPage } from "openai/pagination.mjs";
import { CHAT_THREAD_ATTRIBUTE, ChatThreadModel } from "@/features/chat-page/chat-services/models";
import { getCurrentUser, userHashedId } from "@/features/auth-page/helpers";
import { UpsertChatThread } from "@/features/chat-page/chat-services/chat-thread-service";
import { AssistantModel } from "./models";
import { Assistant } from "openai/resources/beta/assistants.mjs";


export const FindAllAssistantForCurrentUser = async (): Promise<
  ServerActionResponse<Array<Assistant>>
> => {
  try {
    const openAI = OpenAIAssistant();
    const myAssistants = await openAI.beta.assistants.list({
        order: "desc",
        limit: 20,
      });
    return {
      status: "OK",
      response: myAssistants.data,
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Erreur liste assistant introuvable: ${error}`,
        },
      ],
    };
  }
};

export const FindAssistantByID = async (
  id: string
): Promise<
  ServerActionResponse<Assistant>
> => {
  try {
    const openAI = OpenAIAssistant();
    const assistant = await openAI.beta.assistants.retrieve(id);
    return {
      status: "OK",
      response: assistant,
    };
  } catch (error) {
    return {
      status: "ERROR",
      errors: [
        {
          message: `Erreur sur la recherche de l'assistant: ${error}`,
        },
      ],
    };
  }
};

export const CreateAssistantChat = async (
  assistantId: string
): Promise<ServerActionResponse<ChatThreadModel>> => {
  const assistantResponse = await FindAssistantByID(assistantId);
  const user = await getCurrentUser();

  if (assistantResponse.status === "OK") {
    const assistant = assistantResponse.response;

    const openai = OpenAIAssistant();
    const emptyThread = await openai.beta.threads.create();


    const response = await UpsertChatThread({
      name: assistant.name ?? "Assistant",
      useName: user.name,
      userId: await userHashedId(),
      id: "",
      createdAt: new Date(),
      lastMessageAt: new Date(),
      bookmarked: false,
      isDeleted: false,
      type: CHAT_THREAD_ATTRIBUTE,
      personaMessage: "",
      personaMessageTitle: "",
      personaTemperature: 1,
      extension: [],
      assistantID: assistantId,
      threadAssistantID: emptyThread.id,
    });

    return response;
  }
  return assistantResponse;
};



