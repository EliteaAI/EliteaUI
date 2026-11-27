import { describe, expect, it } from 'vitest';

import { hasUnsavedEdits } from '../unsavedEdits.helpers';

describe('hasUnsavedEdits', () => {
  it('is false when there are no edits', () => {
    expect(hasUnsavedEdits({}, { instructions: 'a' })).toBe(false);
    expect(hasUnsavedEdits(undefined, { instructions: 'a' })).toBe(false);
  });

  it('is false when every edit equals the saved value', () => {
    expect(
      hasUnsavedEdits(
        { instructions: 'a', conversation_starters: ['x', 'y'] },
        { instructions: 'a', conversation_starters: ['x', 'y'] },
      ),
    ).toBe(false);
  });

  it('is true when a text edit differs from the saved value', () => {
    expect(hasUnsavedEdits({ instructions: 'b' }, { instructions: 'a' })).toBe(true);
  });

  it('is true when only one of several edits differs', () => {
    expect(hasUnsavedEdits({ instructions: 'a', welcome_message: 'hi' }, { instructions: 'a' })).toBe(true);
  });

  it('ignores empty starters on both sides, the way they are saved', () => {
    expect(hasUnsavedEdits({ conversation_starters: ['x', ''] }, { conversation_starters: ['x'] })).toBe(
      false,
    );
    expect(hasUnsavedEdits({ conversation_starters: [''] }, {})).toBe(false);
  });

  it('is true when the starters differ', () => {
    expect(hasUnsavedEdits({ conversation_starters: ['x', 'y'] }, { conversation_starters: ['x'] })).toBe(
      true,
    );
  });

  it('counts an edit with no saved counterpart as unsaved', () => {
    expect(hasUnsavedEdits({ 'file:scripts/fill.py': 'print(2)' }, { instructions: 'a' })).toBe(true);
    expect(hasUnsavedEdits({ instructions: 'a' }, undefined)).toBe(true);
  });
});
