export const buildMermaidQuickFixPrompt = ({ basePrompt, error, code }) => {
  const resolvedBasePrompt = String(basePrompt || '').trim();

  return `${resolvedBasePrompt}\n\n---\n\nMermaid error:\n${error || ''}\n\nMermaid code:\n${code || ''}\n`;
};
