import { FC, useEffect, useState } from "react";
import { ToggleRight, ToggleLeft, Globe } from "lucide-react";
import { chatStore } from "@/features/chat-page/chat-store";
import { ExtensionModel } from "@/features/extensions-page/extension-services/models";

interface Props {
  extensions: Array<ExtensionModel>;
}

export const WebSearchExtension: FC<Props> = (props) => {
  const [active, setActive] = useState<boolean>(false);
  useEffect(() => {
    const isActive: boolean = chatStore.isSearchExtensionState(); // Ensure type is boolean
    setActive(isActive); // This should work without issues
  }, []);


  const bingExtension = props.extensions.find(
    (ext) => ext.name === "Bing Search"
  );
    if (bingExtension) {
        const extensionId = bingExtension.id;
        const handleToggle = async () => {
            if (chatStore.updateSearchExtensionState(!active)) {
                await chatStore.AddExtensionToChatThread(extensionId);
                setActive(true);
            } else {
                await chatStore.RemoveExtensionFromChatThread(extensionId);
                setActive(false);
            }
        };

        return (
            <button
            onClick={handleToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-200 focus:outline-none ${
                active ? "bg-green-500 text-white" : "bg-gray-200 text-gray-800"
            }`}
            >
            {active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}<Globe size={20}/>
            <span className="text-sm font-medium">Rechercher sur le web</span>
            </button>
        );
    }
    return ("");

}
