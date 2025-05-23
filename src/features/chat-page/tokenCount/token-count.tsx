import React, { useEffect, useMemo, useState } from 'react';
import { ChatMessageModel } from "../chat-services/models";
import { getTotalTokenUsed, getTokenCostToCost } from './utils';
import { modelOptions } from '@/features/theme/theme-config';

interface TokenCountProps {
    messages: ChatMessageModel[];
    gptModel: string|undefined;
}

const TokenCount: React.FC<TokenCountProps> = ({ messages, gptModel }) => {

    const selectedModel = modelOptions[gptModel || 'gpt-4o-mini']; // Set default value if gptModel is not found in modelOptions
    // Utilise le hook useEffect pour mettre à jour l'état tokenCount et cost
    useEffect(() => {
        const model = selectedModel;
        const tokens = getTotalTokenUsed(model, messages);
        const cost = getTokenCostToCost(tokens.prompt, tokens.completion, model);
        setTokenCount(tokens.prompt + tokens.completion);
        setCost(cost);
    }, [messages, selectedModel]); // Déclenche la mise à jour lorsque les messages ou le modèle changent

    const [tokenCount, setTokenCount] = useState<number>(0);
    const [cost, setCost] = useState<number>(0);

    return (
        <div>
            <div className='text-xs italic text-corporateblue'>
                Estimation des Tokens : {tokenCount} ({cost} €)
            </div>
        </div>
    );
};

export default TokenCount;
