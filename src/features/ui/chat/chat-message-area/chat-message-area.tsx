"use client";
import { cn } from "@/ui/lib";
import {
  CheckIcon,
  ClipboardIcon,
  PocketKnife,
  UserCircle,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarImage } from "../../avatar";
import { Button } from "../../button";

export const ChatMessageArea = (props: {
  children?: React.ReactNode;
  profilePicture?: string | null;
  profileName?: string;
  role: "function" | "user" | "assistant" | "system" | "tool";
  onCopy: () => void;
  onDelete: () => void;
}) => {
  const [isIconChecked, setIsIconChecked] = useState(false);
  const [isIconDeleteChecked, setIsIconDeleteChecked] = useState(false);


  const handleButtonDeleteClick = () => {
    props.onDelete();
    setIsIconDeleteChecked(true);
  };

  const handleButtonClick = () => {
    props.onCopy();
    setIsIconChecked(true);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsIconChecked(false);
      setIsIconDeleteChecked(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isIconChecked]);

  let profile = null;

  switch (props.role) {
    case "assistant":
    case "user":
      if (props.profilePicture) {
        profile = (
          <Avatar>
            <AvatarImage src={props.profilePicture} />
          </Avatar>
        );
      } else {
        profile = (
          <UserCircle
            size={28}
            strokeWidth={1.4}
            className="text-muted-foreground"
          />
        );
      }
      break;
    case "tool":
    case "function":
      profile = (
        <PocketKnife
          size={28}
          strokeWidth={1.4}
          className="text-muted-foreground"
        />
      );
      break;
    default:
      break;
  }

  return (
    <div className="container max-w-5xl relative flex flex-col gap-4">
      {/* Container global pour chaque message */}
      <div className={cn("w-full", props.role === "user" ? "flex justify-end" : "")}>
        {/* Bloc du message */}
        <div
          className={cn(
            props.role === "user" ? "max-w-[800px]" : "w-full",
            "flex flex-col border rounded-lg shadow-lg overflow-hidden p-4 gap-8"
          )}
        >
          <div className="h-7 flex items-center justify-between">
            <div className="flex gap-3">
              {profile}
              <div
                className={cn(
                  "text-corporateblue font-bold capitalize items-center flex",
                  props.role === "function" || props.role === "tool" ? "text-muted-foreground text-sm" : ""
                )}
              >
                {props.profileName}
              </div>
            </div>
            <div className="h-7 flex items-center justify-end gap-2">
              <Button
                variant={"ghost"}
                size={"sm"}
                title="Copy text"
                className="flex items-center hover:bg-gray-100 transition-colors duration-150 rounded"
                onClick={handleButtonClick}
              >
                {isIconChecked ? <CheckIcon size={16} /> : <ClipboardIcon size={16} />}
              </Button>
              <Button
                variant={"ghost"}
                size={"sm"}
                title="Delete message"
                className="flex items-center hover:bg-gray-100 transition-colors duration-150 rounded"
                onClick={handleButtonDeleteClick}
              >
                {isIconDeleteChecked ? <CheckIcon size={16} /> : <Trash2 size={16} />}
              </Button>
            </div>
          </div>
          <div
            className={cn(
              "-m-4 p-4 prose prose-slate dark:prose-invert break-words prose-p:leading-relaxed prose-pre:p-0 transition-colors duration-200",
              props.role === "user"
                ? "max-w-3xl bg-ring text-white overflow-y-auto resize-y"
                : "max-w-5xl"
            )}
            style={
              props.role === "user"
                ? { height: "7rem", minHeight: "6rem" }
                : undefined
            }
          >
            {props.children}
          </div>
        </div>
      </div>
    </div>


  );
};
