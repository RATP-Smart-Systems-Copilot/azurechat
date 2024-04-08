import React, { useEffect, useMemo, useState } from 'react';
import { ChatMessageModel } from "../chat-services/models";
import { ModelOptions } from '../../theme/theme-config';
import { getTotalTokenUsed, getTokenCostToCost } from './utils';
import { speechToTextStore } from '../chat-input/speech/use-speech-to-text';

interface TokenCountProps {
    messages: ChatMessageModel[];
    model: ModelOptions;
}

const TokenCount: React.FC<TokenCountProps> = ({ messages, model }) => {
    // Utilise le hook useEffect pour mettre à jour l'état tokenCount une seule fois
    useEffect(() => {
        const tokens = getTotalTokenUsed(model, messages);
        const cost = getTokenCostToCost(tokens.prompt, tokens.completion, model);
        setTokenCount(tokens.prompt + tokens.completion);
        setCost(cost);
    }, [messages, model]); // Déclenche la mise à jour lorsque les messages ou le modèle changent

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
