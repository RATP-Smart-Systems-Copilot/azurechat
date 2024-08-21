"use client";

import { Button } from "@/features/ui/button";
import { Pencil, Plus } from "lucide-react";
import { FC } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { LoadingIndicator } from "../ui/loading";
import { useFormStatus } from "react-dom";
import { StartNewChatGPT } from "../chat-home-page/chat-home";

interface Props {
  model: string;
  name: string;
  index: number;
  description: string;
}

export const ChatCard: FC<Props> = (props) => {
    const { pending } = useFormStatus();
    const { model, name, index, description } = props;

  return (
    <Card key={index} className="flex flex-col">
        <CardHeader className="flex flex-row">
            <CardTitle className="flex-1">{name}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex-1">
        {description}
        </CardContent>
        <CardFooter className="gap-1 content-stretch f">
        <StartNewChatGPT gpt={props} />
      </CardFooter>
    </Card>
  );
};
