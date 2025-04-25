import React, { useEffect, useRef } from "react";

export const ChatTextInput = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ value, onChange, ...props }, ref) => {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // reset height to auto to shrink if needed
      // Ajuste la hauteur uniquement si la hauteur actuelle est inférieure au scrollHeight
      if (textarea.clientHeight < textarea.scrollHeight) {
        textarea.style.height = textarea.scrollHeight + "px";
      }
    }
  }, [value, textareaRef]);

  return (
    <textarea
      ref={textareaRef}
      className="p-4 w-full focus:outline-none bg-transparent resize-y" // resize-y autorise redimension verticale
      placeholder="Type your message here..."
      value={value}
      onChange={onChange}
      {...props}
    />
  );
});
ChatTextInput.displayName = "ChatTextInput";
