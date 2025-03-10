import { userHashedId } from "@/features/auth-page/helpers";
import { ChatHome } from "@/features/chat-home-page/chat-home";
import { FindAllExtensionForCurrentUser } from "@/features/extensions-page/extension-services/extension-service";
import { FindAllPersonaForCurrentUser } from "@/features/persona-page/persona-services/persona-service";
import { getModelOptions } from "@/features/theme/theme-config";
import { DisplayError } from "@/features/ui/error/display-error";

export default async function Home() {
  const [personaResponse, extensionResponse] = await Promise.all([
    FindAllPersonaForCurrentUser(),
    FindAllExtensionForCurrentUser(),
  ]);

  if (personaResponse.status !== "OK") {
    return <DisplayError errors={personaResponse.errors} />;
  }

  const userId = await userHashedId();
  const userPersonas = personaResponse.response.filter(persona => persona.userId === userId);
  const sharedPersonas = personaResponse.response.filter(persona => persona.isPublished || (persona.sharedWith && persona.sharedWith.includes(userId)));

  if (extensionResponse.status !== "OK") {
    return <DisplayError errors={extensionResponse.errors} />;
  }
  return (
    <ChatHome
      personas={userPersonas}
      extensions={extensionResponse.response}
      gpts={getModelOptions()}
      sharedPersonas={sharedPersonas}
    />
  );
}
