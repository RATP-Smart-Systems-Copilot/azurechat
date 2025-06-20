import { userHashedId } from "@/features/auth-page/helpers";
import { ChatPersonaPage } from "@/features/persona-page/persona-page";
import { FindAllPersonaForCurrentUser } from "@/features/persona-page/persona-services/persona-service";
import { DisplayError } from "@/features/ui/error/display-error";

export default async function Home() {
  const personasResponse = await FindAllPersonaForCurrentUser();
  if (personasResponse.status !== "OK") {
    return <DisplayError errors={personasResponse.errors} />;
  }

  const userId = await userHashedId();
  const userPersonas = personasResponse.response.filter(persona => persona.userId === userId);
  const sharedPersonas = personasResponse.response.filter(persona => persona.isPublished || (persona.sharedWith && persona.sharedWith.includes(userId)));
  const sharepointUrl = process.env.NEXT_PUBLIC_SHAREPOINT_URL || "";

  return <ChatPersonaPage personas={userPersonas} sharedPersonas={sharedPersonas} sharepointUrl={sharepointUrl} />;
}
