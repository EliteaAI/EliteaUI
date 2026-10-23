import { describe, expect, it } from 'vitest';

import { INTERNAL_TOOLS_LIST } from '../internalTools.constants';

describe('internal tools order (#6983)', () => {
  // Early feedback: Web Search sits at the end of the chat "+ -> Modules" list
  it('lists Web Search last', () => {
    expect(INTERNAL_TOOLS_LIST.at(-1).name).toBe('web_search');
  });

  it('keeps every tool exactly once', () => {
    const names = INTERNAL_TOOLS_LIST.map(tool => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
