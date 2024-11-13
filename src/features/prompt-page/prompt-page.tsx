import { FC } from "react";

import { DisplayError } from "../ui/error/display-error";
import { ScrollArea } from "../ui/scroll-area";
import { AddPromptSlider } from "./add-new-prompt";
import { PromptCard } from "./prompt-card";
import { PromptHero } from "./prompt-hero/prompt-hero";
import { FindAllPromptForCurrentUser } from "./prompt-service";

interface ChatSamplePromptProps {}

export const ChatSamplePromptPage: FC<ChatSamplePromptProps> = async (
  props
) => {
  const promptsResponse = await FindAllPromptForCurrentUser();

  if (promptsResponse.status !== "OK") {
    return <DisplayError errors={promptsResponse.errors} />;
  }

  // Filtrer les prompts en fonction de leur statut
  const myPrompts = promptsResponse.response.filter(prompt => !prompt.isPublished);
  const sharedPrompts = promptsResponse.response.filter(prompt => prompt.isPublished);

  return (
    <ScrollArea className="flex-1">
      <main className="flex flex-1 flex-col">
        <PromptHero />
        <div className="container max-w-4xl py-3">
          {/* Section "Mes assistants" */}
          <h2 className="text-lg font-bold">Mes assistants</h2>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {myPrompts.map((prompt) => (
              <PromptCard prompt={prompt} key={prompt.id} showContextMenu />
            ))}
          </div>

          {/* Section "Assistants partagés" */}
          <h2 className="text-lg font-bold">Assistants partagés</h2>
          <div className="grid grid-cols-3 gap-3">
            {sharedPrompts.map((prompt) => (
              <PromptCard prompt={prompt} key={prompt.id} showContextMenu={false} />
            ))}
          </div>
        </div>
        <AddPromptSlider />
      </main>
    </ScrollArea>
  );
};
