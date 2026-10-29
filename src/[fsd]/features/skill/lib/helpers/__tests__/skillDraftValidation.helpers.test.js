import { describe, expect, it } from 'vitest';

import { validateSkillDraft } from '../skillDraftValidation.helpers';

const DRAFT = { name: 'converter', description: 'Converts files', instructions: 'Convert them.' };

describe('validateSkillDraft Agent Skills spec rules', () => {
  it('accepts a draft that follows the rules', () => {
    expect(validateSkillDraft(DRAFT, 50000)).toEqual({});
  });

  it('rejects a generated name with consecutive hyphens before it reaches the server', () => {
    expect(validateSkillDraft({ ...DRAFT, name: 'file--converter' }, 50000).name).toBe(
      'Name cannot contain consecutive hyphens (--)',
    );
  });

  it.each(['Converts <input> files', 'Maps a -> b'])(
    'rejects a generated description with angle brackets: %s',
    description => {
      expect(validateSkillDraft({ ...DRAFT, description }, 50000).description).toBe(
        'Description cannot contain angle brackets (< or >)',
      );
    },
  );
});
