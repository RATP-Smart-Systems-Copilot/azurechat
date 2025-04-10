import { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  title: string;
}

export const ChatGroup = (props: Props) => {
  return (
    <div className="flex flex-col">
      <div className="text-xs font-semibold text-muted-foreground/70 px-3 py-1 uppercase tracking-wide">
        {props.title}
      </div>
      <div className="flex flex-col gap-1">
        {props.children}
      </div>
    </div>
  );
};
