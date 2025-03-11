"use client"

import { AddExtension } from "@/features/extensions-page/add-extension/add-new-extension";
import { ExtensionCard } from "@/features/extensions-page/extension-card/extension-card";
import { ExtensionModel } from "@/features/extensions-page/extension-services/models";
import { PersonaCard } from "@/features/persona-page/persona-card/persona-card";
import { PersonaModel } from "@/features/persona-page/persona-services/models";
import { AI_DESCRIPTION, AI_NAME, GPTS } from "@/features/theme/theme-config";
import { Hero } from "@/features/ui/hero";
import { ScrollArea } from "@/features/ui/scroll-area";
import Image from "next/image";
import { FC } from "react";
import { ChatCard } from "../chat-page/chat-card";
import { LoadingIndicator } from "@/features/ui/loading";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { CreatNewChatGPT } from "../chat-page/chat-services/chat-thread-service";

interface ChatPersonaProps {
  personas: PersonaModel[];
  extensions: ExtensionModel[];
  gpts: GPTS;
  sharedPersonas: PersonaModel[];
}

interface Props {
  gpt: string;
}

export const StartNewChatGPT: FC<Props> = (props) => {
  const { gpt } = props;
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      className="flex-1 gap-3"
      onClick={async () => {
        setIsLoading(true);
        const response = await CreatNewChatGPT(gpt);
        setIsLoading(false);
      }}
    >
      {isLoading ? (
        <LoadingIndicator isLoading={isLoading} />
      ) : (
        <MessageCircle size={18} />
      )}
      Start chat
    </Button>
  );
};


export const ChatHome: FC<ChatPersonaProps> = (props) => {

  const llmModels: GPTS = props.gpts;

  return (
    <ScrollArea className="flex-1">
      <main className="flex flex-1 flex-col gap-6 pb-6">
        <Hero
          title={
            <>
              <Image
                src={"/ratp-hd.png"}
                width={300}
                height={100}
                quality={100}
                alt="ai-icon"
              />{" "}
              {AI_NAME}
            </>
          }
          description={AI_DESCRIPTION}
        ></Hero>
        <div className="container max-w-6xl flex gap-20 flex-col">
          <div>
            <h2 className="text-corporateblue text-2xl font-bold mb-3">LLM disponibles</h2>
            <div className="grid grid-cols-2 gap-6 max-w-5xl">
              <div className="space-y-3 p-4 bg-blue-100 rounded-lg shadow">
                <Image
                  src={"/openai.png"}
                  width={80}
                  height={30}
                  quality={100}
                  alt="ai-icon"
                />
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(llmModels).filter(([_, model]) => model.provider === 'OpenAI').map(([key, model], index) => (
                    <ChatCard
                      key={key}
                      model={key}
                      name={model.name}
                      index={index}
                      description={model.description} />
                  ))}
                </div>
              </div>
              <div className="space-y-3 p-4 bg-green-100 rounded-lg shadow">
                <Image
                  src={"/mistralai.png"}
                  width={80}
                  height={50}
                  quality={100}
                  alt="ai-icon"
                />
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(llmModels).filter(([_, model]) => model.provider === 'MistralAI').map(([key, model], index) => (
                    <ChatCard
                      key={key}
                      model={key}
                      name={model.name}
                      index={index}
                      description={model.description} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-corporateblue text-2xl font-bold mb-3">Assistant</h2>
            <br />
            {/* Afficher les personas de l'utilisateur */}
            {props.personas.length > 0 ? (
              <div>
                <h3 className="text-muted-foreground">Mes Assistants</h3>
                <br />
                <div className="grid grid-cols-3 gap-3">
                  {props.personas.map((persona) => (
                    <PersonaCard
                      persona={persona}
                      key={persona.id}
                      showContextMenu={false}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground max-w-xl">Aucun assistant créé</p>
            )}
            <br />
            {/* Afficher les personas partagés */}
            {props.sharedPersonas.length > 0 ? (
              <div>
                <h3 className="text-muted-foreground">Assistants Partagés</h3>
                <br />
                <div className="grid grid-cols-3 gap-3">
                  {props.sharedPersonas.map((persona) => (
                    <PersonaCard
                      persona={persona}
                      key={persona.id}
                      showContextMenu={false}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground max-w-xl">Aucun assistant partagé</p>
            )}
          </div>
          { <div>
            <h2 className="text-corporateblue text-2xl font-bold mb-3">Extensions</h2>

            {props.extensions && props.extensions.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {props.extensions.map((extension) => {
                  return (
                    <ExtensionCard
                      extension={extension}
                      key={extension.id}
                      showContextMenu={false}
                    />
                  );
                })}
              </div>
            ) :
              <p className="text-muted-foreground max-w-xl">No extentions created</p>
            }

          </div> }
        </div>
        <AddExtension />
      </main>
    </ScrollArea>
  );
};
