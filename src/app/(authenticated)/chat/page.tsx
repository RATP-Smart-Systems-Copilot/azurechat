import { FindAllAssistantForCurrentUser } from "@/features/assistant-page/assistant-services/assistant-service";
import { ChatHome } from "@/features/chat-home-page/chat-home";
import { getModelOptions } from "@/features/common/services/openai";
import { FindAllExtensionForCurrentUser } from "@/features/extensions-page/extension-services/extension-service";
import { FindAllPersonaForCurrentUser } from "@/features/persona-page/persona-services/persona-service";
import { DisplayError } from "@/features/ui/error/display-error";

export default async function Home() {
  const [personaResponse, extensionResponse, assistantResponse] = await Promise.all([
    FindAllPersonaForCurrentUser(),
    FindAllExtensionForCurrentUser(),
    FindAllAssistantForCurrentUser(),
  ]);

  if (personaResponse.status !== "OK") {
    return <DisplayError errors={personaResponse.errors} />;
  }

  if (extensionResponse.status !== "OK") {
    return <DisplayError errors={extensionResponse.errors} />;
  }

  if (assistantResponse.status !== "OK") {
    return <DisplayError errors={assistantResponse.errors} />;
  }
  return (
    <ChatHome
      personas={personaResponse.response}
      extensions={extensionResponse.response}
      gpts={getModelOptions()}
      assistants={assistantResponse.response}
    />
  );
}
