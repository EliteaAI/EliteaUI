export const extractMermaidCode = text => {
  if (!text) return '';
  const raw = String(text).trim();

  const fencedMermaid = raw.match(/```mermaid\s*([\s\S]*?)```/i);
  if (fencedMermaid?.[1]) {
    return fencedMermaid[1].trim();
  }

  const fencedAny = raw.match(/```\s*([\s\S]*?)```/);
  if (fencedAny?.[1]) {
    return fencedAny[1].trim();
  }

  return raw;
};

const coerceContentToText = value => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.map(part => part?.text || part?.content || '').join('');
  }
  return '';
};

const extractLastChatHistoryText = chatHistory => {
  if (!Array.isArray(chatHistory) || chatHistory.length === 0) return '';

  for (let index = chatHistory.length - 1; index >= 0; index -= 1) {
    const msg = chatHistory[index];
    const role = msg?.role || msg?.type;
    const contentText = coerceContentToText(msg?.content ?? msg);

    if (!contentText) continue;

    if (role === 'assistant' || role === 'ai') {
      return contentText;
    }
  }

  const fallback = chatHistory[chatHistory.length - 1];
  return coerceContentToText(fallback?.content ?? fallback);
};

const extractLastThinkingStepText = thinkingSteps => {
  if (!Array.isArray(thinkingSteps) || thinkingSteps.length === 0) return '';

  for (let index = thinkingSteps.length - 1; index >= 0; index -= 1) {
    const step = thinkingSteps[index];
    const text = coerceContentToText(step?.text ?? step);
    if (text) return text;
  }

  return '';
};

export const extractPredictText = response => {
  const result = response?.result ?? response;

  if (typeof result === 'string') return result;
  if (!result) return '';

  if (typeof result.elitea_response === 'string') return result.elitea_response;
  if (typeof result.output === 'string') return result.output;

  const chatHistoryText = extractLastChatHistoryText(result.chat_history);
  if (chatHistoryText) return chatHistoryText;

  const thinkingText = extractLastThinkingStepText(result.thinking_steps);
  if (thinkingText) return thinkingText;

  const messages = result.messages;
  if (Array.isArray(messages) && messages.length > 0) {
    const last = messages[messages.length - 1];
    if (typeof last === 'string') return last;
    if (typeof last?.content === 'string') return last.content;
    if (Array.isArray(last?.content)) {
      return last.content.map(part => part?.text || '').join('');
    }
  }

  try {
    return JSON.stringify(result);
  } catch {
    return String(result);
  }
};
