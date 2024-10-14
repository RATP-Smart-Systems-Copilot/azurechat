"use client"

import { AddExtension } from "@/features/extensions-page/add-extension/add-new-extension";
import { ExtensionCard } from "@/features/extensions-page/extension-card/extension-card";
import { ExtensionModel } from "@/features/extensions-page/extension-services/models";
import { PersonaCard } from "@/features/persona-page/persona-card/persona-card";
import { PersonaModel } from "@/features/persona-page/persona-services/models";
import { AI_DESCRIPTION, AI_NAME } from "@/features/theme/theme-config";
import { Hero } from "@/features/ui/hero";
import { ScrollArea } from "@/features/ui/scroll-area";
import Image from "next/image";
import { FC } from "react";
import { ChatCard } from "../chat-page/chat-card";
import { GPTS, GPT } from "../common/services/openai";
import { LoadingIndicator } from "@/features/ui/loading";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { CreatNewChatGPT } from "../chat-page/chat-services/chat-thread-service";

interface ChatPersonaProps {
  personas: PersonaModel[];
  extensions: ExtensionModel[];
  gpts: GPTS;
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
        <div className="container max-w-4xl flex gap-20 flex-col">
          <div>
            <h2 className="text-corporateblue text-2xl font-bold mb-3">GPTs disponibles</h2>
            <div className="grid grid-cols-3 gap-3">
              <ChatCard model={props.gpts['gpt-4o-mini'].model} name={props.gpts['gpt-4o-mini'].name} index={0} description={props.gpts['gpt-4o-mini'].description} />
              <ChatCard model={props.gpts['gpt4o'].model} name={props.gpts['gpt4o'].name} index={0} description={props.gpts['gpt4o'].description} />
            </div>
          </div>
          <div>
            <h2 className="text-corporateblue text-2xl font-bold mb-3">Personas</h2>

            {props.personas && props.personas.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {props.personas.map((persona) => {
                  return (
                    <PersonaCard
                      persona={persona}
                      key={persona.id}
                      showContextMenu={false}
                    />
                  );
                })}
              </div>
            ) :
              <p className="text-muted-foreground max-w-xl">No personas created</p>
            }
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
