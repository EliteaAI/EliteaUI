import { describe, expect, it } from 'vitest';

import { INTERNAL_TOOLS_LIST } from '../internalTools.constants';

describe('internal tools order (#6983)', () => {
  // Early feedback: Web Search sits at the end of the chat "+ -> Modules" list,
  // followed only by Code Mode (beta), which was appended afterwards (EL-7580)
  it('lists Web Search at the end, followed only by Code Mode', () => {
    const names = INTERNAL_TOOLS_LIST.map(tool => tool.name);
    expect(names.slice(-2)).toEqual(['web_search', 'code_mode']);
  });

  it('keeps every tool exactly once', () => {
    const names = INTERNAL_TOOLS_LIST.map(tool => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
