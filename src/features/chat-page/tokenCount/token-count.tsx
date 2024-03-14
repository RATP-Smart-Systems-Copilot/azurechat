import React, { useEffect, useMemo, useState } from 'react';
import { ChatMessageModel } from "../chat-services/models";
import { modelCost, ModelOptions } from '../../theme/theme-config';
import countTokens from './utils';

interface TokenCountProps {
    messages: ChatMessageModel[];
    model: ModelOptions;
}

const TokenCount: React.FC<TokenCountProps> = ({ messages, model }) => {
    const [tokenCount, setTokenCount] = useState<number>(0);

    useEffect(() => {
        setTokenCount(countTokens(messages, model));
    }, [messages, model]);

    const cost = useMemo(() => {
      const price =
        modelCost[model].prompt.price *
        (tokenCount / modelCost[model].prompt.unit);
      return price.toPrecision(3);
    }, [model, tokenCount]);

    return (
      <div>
        <div className='text-xs italic text-corporateblue'>
          Estimation des Tokens : {tokenCount} ({cost} €)
        </div>
      </div>
    );
};

export default TokenCount;
