import { CreateChatAndRedirect } from "../chat-services/chat-thread-service";
import { ChatContextMenu } from "./chat-context-menu";
import { NewChat } from "./new-chat";

export const ChatMenuHeader = () => {
  return (
    <div className="flex p-2 px-3 justify-end">
      <div className="flex flex-col gap-8 px-12">
          <img src="/ratp-hd.png" className="w-36"/>
        </div>
      <form action={CreateChatAndRedirect} className="flex gap-2 pr-3">
        <NewChat />
        <ChatContextMenu />
      </form>
    </div>
  );
};
