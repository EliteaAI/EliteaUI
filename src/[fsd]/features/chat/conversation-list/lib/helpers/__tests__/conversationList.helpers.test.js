import { describe, expect, it, vi } from 'vitest';

// The helper reaches @/common/utils, which pulls in the redux store and cannot load
// in this environment; only stableSort is actually needed there.
vi.mock('@/common/utils', () => ({ stableSort: (items, comparator) => [...items].sort(comparator) }));

const { CONVERSATION_NAME_MAX_LENGTH } =
  await import('@/[fsd]/features/chat/conversation-list/lib/constants');
const { generateDuplicateName } = await import('../conversationList.helpers');

describe('generateDuplicateName', () => {
  it('appends a first copy suffix to a plain name', () => {
    expect(generateDuplicateName('My chat')).toBe('My chat (1)');
  });

  it('increments an existing copy suffix', () => {
    expect(generateDuplicateName('My chat (1)')).toBe('My chat (2)');
    expect(generateDuplicateName('My chat (9)')).toBe('My chat (10)');
  });

  it('truncates the base name so the suffix fits within the limit', () => {
    const originalName = 'a'.repeat(CONVERSATION_NAME_MAX_LENGTH);

    const result = generateDuplicateName(originalName);

    expect(result).toBe(`${'a'.repeat(CONVERSATION_NAME_MAX_LENGTH - 4)} (1)`);
    expect(result.length).toBe(CONVERSATION_NAME_MAX_LENGTH);
  });

  it('truncates when incrementing a copy suffix on a name at the limit', () => {
    const baseName = 'b'.repeat(CONVERSATION_NAME_MAX_LENGTH - 4);

    const result = generateDuplicateName(`${baseName} (9)`);

    expect(result).toBe(`${baseName.slice(0, CONVERSATION_NAME_MAX_LENGTH - 5)} (10)`);
    expect(result.length).toBe(CONVERSATION_NAME_MAX_LENGTH);
  });

  it('does not leave trailing spaces before the suffix after truncation', () => {
    const originalName = `${'c'.repeat(CONVERSATION_NAME_MAX_LENGTH - 6)}   word`;

    const result = generateDuplicateName(originalName);

    expect(result).toBe(`${'c'.repeat(CONVERSATION_NAME_MAX_LENGTH - 6)} (1)`);
    expect(result.length).toBeLessThanOrEqual(CONVERSATION_NAME_MAX_LENGTH);
  });

  it('keeps short names untouched apart from the suffix', () => {
    expect(generateDuplicateName('abc').length).toBeLessThanOrEqual(CONVERSATION_NAME_MAX_LENGTH);
  });
});
