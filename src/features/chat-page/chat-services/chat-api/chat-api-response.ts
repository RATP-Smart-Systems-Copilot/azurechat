"use server";
import "server-only";

import { OpenAIInstance } from "@/features/common/services/openai";
import { FindExtensionByID } from "@/features/extensions-page/extension-services/extension-service";
import { RunnableToolFunction } from "openai/lib/RunnableFunction";
import { ChatCompletionStreamingRunner } from "openai/resources/beta/chat/completions";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ChatCitationModel, ChatThreadModel } from "../models";
import { ResponseStream } from "openai/lib/responses/ResponseStream.mjs";
import { Tool } from "openai/resources/responses/responses.mjs";
import { Store } from "lucide-react";
import { userHashedId } from "@/features/auth-page/helpers";
import { SimilaritySearch } from "../azure-ai-search/azure-ai-search";
import { CreateCitations, FormatCitations } from "../citation-service";

export const ChatApiResponse = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  history: any;
  extensions: Array<any>;
  signal: AbortSignal;
  fileUrl?: string;
}) : Promise<ResponseStream> => {
    const { userMessage, history, signal, chatThread, extensions, fileUrl } = props;

    const openAI = OpenAIInstance(chatThread.gptModel);
    const systemMessage = await extensionsSystemMessage(chatThread);

    let messageUser = await documentUserMessage(userMessage, chatThread);
    let userMessageWithImage= null;
    //construct input user message if file sent 
    if(fileUrl){
        userMessageWithImage = [
            {"type": "input_text", "text": messageUser},
            {
                "type": "input_image",
                "image_url": fileUrl,
            },
        ];
    }

  return openAI.responses.stream(
    {
      model: chatThread.gptModel ?? "gpt-4.1-mini",
      stream: true,
      instructions: chatThread.personaMessage + "\n" + systemMessage,
      input: [
        ...history,
        {
          role: "user",
          content: userMessageWithImage ?? messageUser,
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
      store:false,
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

const documentUserMessage = async (userMessage: string, chatThread: ChatThreadModel) => {
    // Try get document information
    let filter = `user eq '${await userHashedId()}' and chatThreadId eq '${chatThread.id}' or personaId eq '${chatThread.personaId}'`;
    const documentResponse = await SimilaritySearch(
      userMessage,
      10,
      filter
    );
    const documents: ChatCitationModel[] = [];

    if (documentResponse.status === "OK" && documentResponse.response.length > 0) {
      const withoutEmbedding = FormatCitations(documentResponse.response);
      const citationResponse = await CreateCitations(withoutEmbedding);
      citationResponse.forEach((c) => {
        if (c.status === "OK") {
          documents.push(c.response);
        }
      });
      const content = documents
      .map((result, index) => {
        const content = result.content.document.pageContent;
        const context = `[${index}]. file name: ${result.content.document.metadata} \n file id: ${result.id} \n ${content}`;
        return context;
      })
      .join("\n------\n");
        // Augment the user prompt
        const _userMessage = `\n
        - Review the following content from documents uploaded by the user and create a final answer.
        - You must always include a citation at the end of your answer and don't include full stop after the citations.
        - If you don't know the answer, you can try to make up an answer but make it clear.
        - Use the format for your citation {% citation items=[{name:"filename 1",id:"file id"}, {name:"filename 2",id:"file id"}] /%}
        ----------------
        content:
        ${content}
        \n
        ---------------- \n
        question:
        ${userMessage}
        `;
        return _userMessage;
    }

    return userMessage;
  };
