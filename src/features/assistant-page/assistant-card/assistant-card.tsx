import { FC } from "react";
import {  Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../ui/card";
import { AssistantModel } from "../assistant-services/models";
import { StartNewAssistantChat } from "./start-new-assistant-chat";

interface Props {
  assistant: AssistantModel;
  showContextMenu: false
}

export const AssistantCard: FC<Props> = (props) => {
  const { assistant } = props;
  return (
    <Card key={assistant.id} className="flex flex-col">
    <CardHeader className="flex flex-row">
      <CardTitle className="flex-1">{assistant.name}</CardTitle>
    </CardHeader>
    <CardContent className="text-muted-foreground flex-1">
    </CardContent>
    <CardFooter className="gap-1 content-stretch f">
      <StartNewAssistantChat assistant={assistant} />
    </CardFooter>
  </Card>
  )
};
