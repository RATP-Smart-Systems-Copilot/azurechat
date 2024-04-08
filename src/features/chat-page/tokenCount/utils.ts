import { ModelOptions } from '../../theme/theme-config';
import { ChatMessageModel } from "../chat-services/models";
import { modelCost } from '../../theme/theme-config';
import { getEncoding } from 'js-tiktoken';
const encoder = getEncoding('cl100k_base');

// https://github.com/dqbd/tiktoken/issues/23#issuecomment-1483317174
export const getChatGPTEncoding = (
  messages: ChatMessageModel[],
  model: ModelOptions
) => {

  const msgSep = '';
  const roleSep = '<|im_sep|>';

  const serialized = [
    messages
      .map(({ role, content }) => {
        return `<|im_start|>${role}${roleSep}${content}<|im_end|>`;
      })
      .join(msgSep),
    `<|im_start|>assistant${roleSep}`,
  ].join(msgSep);

  return encoder.encode(serialized, 'all');
};

const countTokens = (messages: ChatMessageModel[], model: ModelOptions) => {
  if (messages.length === 0) return 0;
  return getChatGPTEncoding(messages, model).length;
};

export const getTotalTokenUsed = (
  model: ModelOptions,
  messages: ChatMessageModel[],
) => {
  const newPromptTokens = countTokens(messages.slice(0, -1), model);
  const completionMessages = messages.filter(
    (chatMessage) => chatMessage.role === "assistant" || chatMessage.role === "system" || chatMessage.role === "tool"
  );
  const newCompletionTokens = countTokens(completionMessages, model);

  return {completion : newCompletionTokens, prompt: newPromptTokens};
};

export const getTokenCostToCost = (
  promptTokens: number,
  completionTokens: number,
  model: ModelOptions
) => {
  const { prompt, completion } = modelCost[model as keyof typeof modelCost];
  const completionCost =
    (completion.price / completion.unit) * completionTokens;
  const promptCost = (prompt.price / prompt.unit) * promptTokens;
  return completionCost + promptCost;
};

export default countTokens;
