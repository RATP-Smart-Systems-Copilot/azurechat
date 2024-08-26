"use client";

import { LoadingIndicator } from "@/features/ui/loading";
import { MessageCircle } from "lucide-react";
import { FC, useState } from "react";
import { Button } from "../../ui/button";
import { CreateChatWithExtension } from "../extension-services/extension-service";
import { ExtensionModel } from "../extension-services/models";
import { redirect } from "next/navigation";

interface Props {
  extension: ExtensionModel;
}

export const StartNewExtensionChat: FC<Props> = (props) => {
  const { extension } = props;
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      className="flex-1 gap-3"
      onClick={async () => {
        setIsLoading(true);
        const chat = await CreateChatWithExtension(extension.id);
        if (chat.status === "OK") {
          redirect(`/chat/${chat.response.id}`);
        }
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
