"use server";
import "server-only";

import { userHashedId } from "@/features/auth-page/helpers";
import { OpenAIInstance } from "@/features/common/services/openai";
import {
  ChatCompletionStreamingRunner,
  ChatCompletionStreamParams,
} from "openai/resources/beta/chat/completions";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { SimilaritySearch } from "../azure-ai-search/azure-ai-search";
import { CreateCitations, FormatCitations } from "../citation-service";
import { ChatCitationModel, ChatThreadModel } from "../models";
import { AuthorizedDocuments, PersonaDocumentById } from "@/features/persona-page/persona-services/persona-documents-service";
import { convertPersonaDocumentToSharePointDocument } from "@/features/persona-page/persona-services/models";

export const ChatApiRAG = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  history: ChatCompletionMessageParam[];
  signal: AbortSignal;
}): Promise<ChatCompletionStreamingRunner> => {
  const { chatThread, userMessage, history, signal } = props;

  const openAI = OpenAIInstance(chatThread.gptModel);
  const allowedPersonaDocumentIdsResponse =
    await AllowedPersonaDocumentIdsResponse(chatThread.documentIds);

  let filter = `user eq '${await userHashedId()}' and chatThreadId eq '${chatThread.id}' or personaId eq '${chatThread.personaId}'
   or ( (${allowedPersonaDocumentIdsResponse
      .map((id) => `documentId eq '${id}'`)
      .join(" or ")}))`;

  const documentResponse = await SimilaritySearch(
    userMessage,
    10,
    filter
  );

  const documents: ChatCitationModel[] = [];

  if (documentResponse.status === "OK") {
    const withoutEmbedding = FormatCitations(documentResponse.response);
    const citationResponse = await CreateCitations(withoutEmbedding);

    citationResponse.forEach((c) => {
      if (c.status === "OK") {
        documents.push(c.response);
      }
    });
  }

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

  const stream: ChatCompletionStreamParams = {
    model: "",
    stream: true,
    ...(chatThread.gptModel !== "o3-mini" && { temperature: chatThread.personaTemperature }),
    messages: [
      {
        role: "system",
        content: chatThread.personaMessage,
      },
      ...history,
      {
        role: "user",
        content: _userMessage,
      },
    ],
  };

  return openAI.beta.chat.completions.stream(stream, { signal });
};

const AllowedPersonaDocumentIdsResponse = async (
  personaDocumentIds: string[]
) => {
  const personaDocumentsResponses = await Promise.all(
    personaDocumentIds.map(async (id) => {
      try {
        return await PersonaDocumentById(id);
      } catch (error) {
        return null;
      }
    })
  );

  const personaDocuments = personaDocumentsResponses.filter(
    (response) => response !== null && response.status === "OK"
  );


  const allowedPersonaDocuments = await AuthorizedDocuments(
    personaDocuments.map((e) => convertPersonaDocumentToSharePointDocument(e.response))
  );

  return allowedPersonaDocuments;
};
