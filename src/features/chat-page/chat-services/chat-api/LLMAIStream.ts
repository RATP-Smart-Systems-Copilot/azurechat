import { AI_NAME } from "@/features/theme/theme-config";
import { CreateChatMessage } from "../chat-message-service";
import {
  AzureChatCompletion,
  AzureChatLLMCompletionContent,
  ChatThreadModel,
} from "../models";
import { EventMessageStream } from "@azure/core-sse";

export const LLMAIStream = (props: {
  runner: NodeJS.ReadableStream;
  chatThread: ChatThreadModel;
}) => {
  const encoder = new TextEncoder();
  const { runner, chatThread } = props;

  const readableStream = new ReadableStream({
    async start(controller) {
      const streamResponse = (event: string, value: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${value}\n\n`));
      };

      let lastMessage = "";

      runner.on("data", async (chunk) => {
        const chunkStr = chunk.toString();
        // Les données SSE peuvent contenir plusieurs lignes
        const lines = chunkStr.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            // Retirer le préfixe "data: "
            const dataStr = line.slice(6).trim();
            // Si le signal [DONE] est reçu, on ferme le flux
            if (dataStr === "[DONE]") {
               await CreateChatMessage({
                name: AI_NAME,
                content: lastMessage,
                role: "assistant",
                chatThreadId: props.chatThread.id,
              });

              const response: AzureChatCompletion = {
                type: "finalContent",
                response: lastMessage,
              };
              streamResponse(response.type, JSON.stringify(response));
              controller.close();
              continue;
            }
            // On ignore les lignes vides
            if (!dataStr) continue;
            try {
              const parsedChunk = JSON.parse(dataStr);
              // Accumuler le contenu du delta si présent
              const content = parsedChunk.choices?.[0]?.delta?.content;
              if (content !== undefined) {
                lastMessage += content;
              }
              const response: AzureChatLLMCompletionContent = {
                type: "contentLLM",
                response: lastMessage,
                idMessage: parsedChunk.id,
              };

              streamResponse(response.type, JSON.stringify(response));
            } catch (parseError) {
              console.error("Erreur lors du parsing du chunk :", parseError);
            }
          }
        }
      });

      runner.on("end", () => {
        console.log("Flux terminé");
      });

      runner.on("error", (error) => {
        console.error("Erreur dans le traitement du flux :", error);
        controller.error(error);
      });
    },
  });

  return readableStream;
};
