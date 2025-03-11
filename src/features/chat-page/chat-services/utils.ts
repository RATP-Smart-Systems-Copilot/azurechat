import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionFunctionMessageParam,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { ChatMessageModel } from "./models";

export type Role = 'user' | 'assistant' | 'system';
export const roles: Role[] = ['user', 'assistant', 'system'];

export interface MessageInterface {
  role: Role;
  content: string;
}

export const mapOpenAIChatMessages = (
  messages: ChatMessageModel[]
): ChatCompletionMessageParam[] => {
  return messages
  .filter((message) => message.content.trim() !== "") // Filtrer les messages avec un content non vide
  .map((message) => {
    switch (message.role) {
      case "function":
        return {
          role: message.role,
          name: message.name,
          content: message.content,
        } as ChatCompletionFunctionMessageParam;
      case "assistant":
        return {
          role: message.role,
          content: message.content,
        } as ChatCompletionAssistantMessageParam;
      default:
        return {
          role: message.role,
          content: message.content,
        } as ChatCompletionMessageParam;
    }
  });
};

export const mapAIInferenceChatMessages = (
  messages: ChatMessageModel[],
): MessageInterface[] => {
  return messages
    .filter((message) => message.content.trim() !== "") // Filtrer les messages avec un content non vide
    .map((message) => {
      switch (message.role) {
        case "assistant":
        case "user":
          return {
            role: message.role,
            content: message.content,
          };
        default:
          return {
            role: "assistant",
            content: message.content,
          };
      }
    });
};

