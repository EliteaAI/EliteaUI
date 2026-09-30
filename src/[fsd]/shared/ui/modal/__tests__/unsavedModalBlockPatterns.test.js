import { matchPath } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { BLOCK_NAV_PATTERNS } from '@/routes';

const isBlockablePath = pathname => BLOCK_NAV_PATTERNS.some(pattern => matchPath(pattern, pathname));

describe('unsaved-changes navigation guard', () => {
  it.each([
    '/settings/create-ai-provider',
    '/settings/create-ai-provider/llm_model',
    '/settings/edit-ai-provider/42',
  ])('guards the AI provider form at %s', pathname => {
    expect(isBlockablePath(pathname)).toBe(true);
  });

  it('leaves the AI providers list unguarded', () => {
    expect(isBlockablePath('/settings/ai-providers')).toBe(false);
  });
});
