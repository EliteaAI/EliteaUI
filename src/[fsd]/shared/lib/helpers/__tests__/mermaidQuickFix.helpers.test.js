import { describe, expect, it } from 'vitest';

import { extractMermaidCode, extractPredictText } from '../mermaidQuickFix.helpers';

describe('extractMermaidCode', () => {
  it('returns an empty string for empty input', () => {
    expect(extractMermaidCode('')).toBe('');
    expect(extractMermaidCode(null)).toBe('');
  });

  it('unwraps a mermaid fenced block', () => {
    expect(extractMermaidCode('Here:\n```mermaid\ngraph TD\nA-->B\n```\nDone')).toBe('graph TD\nA-->B');
  });

  it('unwraps any fenced block when the language tag is missing', () => {
    expect(extractMermaidCode('```\ngraph TD\nA-->B\n```')).toBe('graph TD\nA-->B');
  });

  it('returns trimmed raw text when there is no fence', () => {
    expect(extractMermaidCode('  graph TD\nA-->B  ')).toBe('graph TD\nA-->B');
  });
});

describe('extractPredictText', () => {
  it('returns an empty string when there is no response', () => {
    expect(extractPredictText(null)).toBe('');
    expect(extractPredictText(undefined)).toBe('');
  });

  it('returns a plain string result', () => {
    expect(extractPredictText({ result: 'graph TD' })).toBe('graph TD');
  });

  it('prefers elitea_response, then output', () => {
    expect(extractPredictText({ result: { elitea_response: 'A', output: 'B' } })).toBe('A');
    expect(extractPredictText({ result: { output: 'B' } })).toBe('B');
  });

  it('takes the last assistant message of the chat history', () => {
    const result = {
      chat_history: [
        { role: 'user', content: 'fix it' },
        { role: 'assistant', content: 'first' },
        { role: 'assistant', content: [{ text: 'sec' }, { text: 'ond' }] },
      ],
    };
    expect(extractPredictText({ result })).toBe('second');
  });

  it('falls back to the last thinking step', () => {
    expect(extractPredictText({ result: { thinking_steps: [{ text: 'one' }, { text: 'two' }] } })).toBe(
      'two',
    );
  });

  it('falls back to the last message content', () => {
    expect(extractPredictText({ result: { messages: ['a', { content: 'last' }] } })).toBe('last');
  });

  it('serialises an unrecognised result', () => {
    expect(extractPredictText({ result: { foo: 1 } })).toBe('{"foo":1}');
  });
});
