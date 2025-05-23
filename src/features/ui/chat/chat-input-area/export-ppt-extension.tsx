import { FC, useEffect, useState } from "react";
import { ToggleRight, ToggleLeft, Presentation } from "lucide-react";
import { chatStore } from "@/features/chat-page/chat-store";

export const PPT_EXTENSION = "PPT_EXTENSION";

export const ExportPPTExtension = () => {
    const [active, setActive] = useState<boolean>(false);
    useEffect(() => {
    const isActive: boolean = chatStore.isExportPPTExtensionState(); // Ensure type is boolean
    setActive(isActive); // This should work without issues
    }, []);

    const handleToggle = async () => {
        if (chatStore.updateSearchExtensionState(!active)) {
            await chatStore.AddExtensionToChatThread(PPT_EXTENSION);
            setActive(true);
        } else {
            await chatStore.RemoveExtensionFromChatThread(PPT_EXTENSION);
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
        {active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}<Presentation size={20}/>
        <span className="text-sm font-medium">Exporter en PPT</span>
        </button>
    );

}
