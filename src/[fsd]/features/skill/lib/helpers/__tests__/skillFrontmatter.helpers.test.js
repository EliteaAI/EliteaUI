import { describe, expect, it } from 'vitest';

import {
  composeSkillEditorText,
  countSkillBodyLength,
  parseSkillEditorText,
  replaceSkillEditorBody,
  writeSkillFrontmatterFields,
} from '../skillFrontmatter.helpers';

const FIELDS = { name: 'triage', description: 'Sorts issues' };
const BODY = '# Steps\n\nDo it.';
const TEXT = composeSkillEditorText({ ...FIELDS, body: BODY });

describe('composeSkillEditorText', () => {
  it('writes the other keys after name and description', () => {
    expect(
      composeSkillEditorText({
        name: 'triage',
        description: 'd',
        frontmatter: { license: 'MIT', 'disable-model-invocation': true },
        body: 'body',
      }),
    ).toBe('---\nname: triage\ndescription: d\nlicense: MIT\ndisable-model-invocation: true\n---\n\nbody');
  });

  it('round-trips the other keys through the editor text', () => {
    const frontmatter = {
      license: 'MIT',
      metadata: { author: 'me', version: '2.0' },
      'argument-hint': '[v]',
    };
    const text = composeSkillEditorText({ name: 'triage', description: 'd', frontmatter, body: 'body' });

    expect(parseSkillEditorText(text).extraFrontmatter).toEqual(frontmatter);
  });

  it('puts name and description in a frontmatter block above the body', () => {
    expect(TEXT).toBe('---\nname: triage\ndescription: Sorts issues\n---\n\n# Steps\n\nDo it.');
  });

  it('writes empty values as bare keys', () => {
    expect(composeSkillEditorText({ name: '', description: '', body: '' })).toBe(
      '---\nname:\ndescription:\n---\n\n',
    );
  });

  it.each([
    'Use when: triaging #bugs',
    'line one\nline two',
    '- starts with a dash',
    '"double" and \'single\' quotes',
    'ends with a line break\n',
    'keeps\n\ntrailing blank lines\n\n',
    '123',
    'true',
    '  leading spaces',
    '  indented first line\nsecond',
  ])('reads %j back unchanged', description => {
    const parsed = parseSkillEditorText(composeSkillEditorText({ name: 'triage', description, body: BODY }));

    expect(parsed.fields.description).toBe(description);
    expect(parsed.body).toBe(BODY);
  });
});

describe('parseSkillEditorText', () => {
  it('splits the frontmatter fields from the body', () => {
    expect(parseSkillEditorText(TEXT)).toEqual({ body: BODY, fields: FIELDS, extraFrontmatter: {} });
  });

  it('keeps leading blank lines of the body', () => {
    const body = '\n\nbody';

    expect(parseSkillEditorText(composeSkillEditorText({ ...FIELDS, body })).body).toBe(body);
  });

  it('reads a body placed right after the closing line', () => {
    expect(parseSkillEditorText('---\nname: triage\n---\nbody').body).toBe('body');
  });

  it('treats text without an opening line as body only', () => {
    expect(parseSkillEditorText(BODY)).toEqual({ body: BODY, fields: {} });
  });

  it.each([
    ['a block without its closing line', '---\nname: triage\nbody'],
    ['broken YAML', '---\nname: "triage\ndescription: x\n---\n\nbody'],
    ['a block that is not key: value pairs', '---\nna\n---\n\nbody'],
  ])('treats the whole text as body for %s', (_case, text) => {
    expect(parseSkillEditorText(text)).toEqual({ body: text, fields: {} });
  });

  it('keeps every instruction when the closing line is deleted above a horizontal rule', () => {
    const text =
      '---\nname: my-skill\ndescription: does things\n\n# Step one\nDo A.\n\n---\n\n# Step two\nDo B.';

    expect(parseSkillEditorText(text)).toEqual({ body: text, fields: {} });
  });

  it('accepts an empty block', () => {
    expect(parseSkillEditorText('---\n---\n\nbody')).toEqual({
      body: 'body',
      fields: {},
      extraFrontmatter: {},
    });
  });

  it.each([
    ['a renamed key', '---\nna: other\ndescription: Sorts issues\n---\n\nbody'],
    ['an empty value', '---\nname:\ndescription: Sorts issues\n---\n\nbody'],
    ['a blank quoted value', "---\nname: '  '\ndescription: Sorts issues\n---\n\nbody"],
    ['a nested value', '---\nname:\n  first: x\ndescription: Sorts issues\n---\n\nbody'],
  ])('leaves name out of the fields for %s', (_case, text) => {
    expect(parseSkillEditorText(text).fields).toEqual({ description: 'Sorts issues' });
  });

  it('ignores keys other than name and description', () => {
    expect(
      parseSkillEditorText(
        '---\nname: triage\ndescription: d\nlicense: MIT\nallowed-tools: Read\n---\n\nbody',
      ).fields,
    ).toEqual({ name: 'triage', description: 'd' });
  });

  it('returns the other keys with their YAML types', () => {
    const text =
      "---\nname: triage\ndescription: d\nlicense: MIT\ndisable-model-invocation: true\nmetadata:\n  version: '2.0'\n---\n\nbody";

    expect(parseSkillEditorText(text).extraFrontmatter).toEqual({
      license: 'MIT',
      'disable-model-invocation': true,
      metadata: { version: '2.0' },
    });
  });

  it.each([
    ['a block without its closing line', '---\nlicense: MIT\nbody'],
    ['broken YAML', '---\nlicense: "MIT\n---\n\nbody'],
  ])('reads no other keys for %s', (_case, text) => {
    expect(parseSkillEditorText(text).extraFrontmatter).toBeUndefined();
  });

  it('reads a non-string scalar as its text', () => {
    expect(parseSkillEditorText('---\nname: 123\n---\n\nbody').fields).toEqual({ name: '123' });
  });
});

describe('writeSkillFrontmatterFields', () => {
  it('rewrites only the changed key line and keeps the rest as typed', () => {
    const text = '---\nname:   triage   # main\nlicense: MIT\ndescription: Sorts issues\n---\n\nbody';

    expect(writeSkillFrontmatterFields(text, { ...FIELDS, name: 'triage-v2' }, ['name'])).toBe(
      '---\nname: triage-v2\nlicense: MIT\ndescription: Sorts issues\n---\n\nbody',
    );
  });

  it('replaces every line of a multi-line value', () => {
    const text = '---\nname: triage\ndescription: |\n  first\n  second\n\nlicense: MIT\n---\n\nbody';

    expect(writeSkillFrontmatterFields(text, { ...FIELDS, description: 'short' }, ['description'])).toBe(
      '---\nname: triage\ndescription: short\n\nlicense: MIT\n---\n\nbody',
    );
  });

  it('appends a key the block does not define', () => {
    const text = '---\nna: triage\n---\n\nbody';

    expect(writeSkillFrontmatterFields(text, FIELDS, ['description'])).toBe(
      '---\nna: triage\ndescription: Sorts issues\n---\n\nbody',
    );
  });

  it('fills an empty block', () => {
    expect(writeSkillFrontmatterFields('---\n---\n\nbody', FIELDS, ['name'])).toBe(
      '---\nname: triage\n---\n\nbody',
    );
  });

  it('inserts a block with both fields when the text has none', () => {
    expect(writeSkillFrontmatterFields(BODY, FIELDS, ['name'])).toBe(TEXT);
  });

  it.each([
    ['broken YAML', '---\nname: "triage\n---\n\nbody'],
    ['a missing closing line', '---\nname: triage\nbody'],
    ['a block that is not key: value pairs', '---\nna\n---\n\nbody'],
  ])('leaves the text untouched for %s', (_case, text) => {
    expect(writeSkillFrontmatterFields(text, FIELDS, ['name'])).toBe(text);
  });

  it('writes a value that reads back unchanged', () => {
    const description = 'Use when: a\nmulti-line # value';
    const text = writeSkillFrontmatterFields(TEXT, { ...FIELDS, description }, ['description']);

    expect(parseSkillEditorText(text).fields.description).toBe(description);
  });
});

describe('replaceSkillEditorBody', () => {
  it('keeps the frontmatter text as typed and swaps the body', () => {
    const text = '---\nname: triage # main\n---\n\nold body';

    expect(replaceSkillEditorBody(text, 'new body', FIELDS)).toBe(
      '---\nname: triage # main\n---\n\nnew body',
    );
  });

  it('rebuilds the block from the fields when the YAML is broken', () => {
    expect(replaceSkillEditorBody('---\nname: "triage\n---\n\nold body', BODY, FIELDS)).toBe(TEXT);
  });

  it('returns the body alone when the text has no block', () => {
    expect(replaceSkillEditorBody('old body', 'new body', FIELDS)).toBe('new body');
  });

  it('rebuilds the block from the fields when the closing line is missing', () => {
    expect(replaceSkillEditorBody('---\nname: tri', BODY, FIELDS)).toBe(TEXT);
  });
});

describe('countSkillBodyLength', () => {
  it('counts the body only', () => {
    expect(countSkillBodyLength(TEXT)).toBe(BODY.length);
  });

  it('counts the whole text when there is no block', () => {
    expect(countSkillBodyLength(BODY)).toBe(BODY.length);
  });

  it('counts the whole text when the closing line is missing', () => {
    expect(countSkillBodyLength('---\nname: x\nbody')).toBe('---\nname: x\nbody'.length);
  });

  it('counts the whole text when the YAML is broken', () => {
    const text = '---\nname: "x\n---\n\nbody';

    expect(countSkillBodyLength(text)).toBe(text.length);
  });
});
