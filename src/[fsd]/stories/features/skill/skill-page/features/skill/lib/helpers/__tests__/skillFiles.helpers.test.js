import { describe, expect, it } from 'vitest';

import {
  buildSkillFileTree,
  describeSkillFiles,
  fileFolderPrefix,
  fileMetaLabel,
  findMentionLines,
} from '../skillFiles.helpers';

const FILES = [
  { path: 'references/FORMS.md', content: 'a\nb' },
  { path: 'scripts/fill.py', content: 'x' },
  { path: 'assets/template.pdf', size: 48 * 1024, binary: true },
  { path: 'LICENSE.txt', content: 'MIT' },
];

describe('skill files helpers', () => {
  it('groups files by folder and keeps root files apart', () => {
    const { folders, rootFiles } = buildSkillFileTree(FILES);
    expect(folders.map(f => f.name)).toEqual(['references', 'scripts', 'assets']);
    expect(rootFiles.map(f => f.path)).toEqual(['LICENSE.txt']);
  });

  it('describes the files for the line under the instructions', () => {
    expect(describeSkillFiles(FILES)).toBe('References 1 · Scripts 1 · Assets 1 · Other 1');
  });

  it('labels a text file by lines and a binary one by size', () => {
    expect(fileMetaLabel(FILES[0])).toBe('2 lines');
    expect(fileMetaLabel(FILES[3])).toBe('1 line');
    expect(fileMetaLabel(FILES[2])).toBe('48 KB');
  });

  it('finds the instruction lines that mention a file', () => {
    const text = '# PDF\n1. Read references/FORMS.md.\n2. Run scripts/fill.py.';
    expect(findMentionLines(text, 'scripts/fill.py')).toEqual([3]);
    expect(findMentionLines(text, 'LICENSE.txt')).toEqual([]);
  });

  it('splits the folder part of a path', () => {
    expect(fileFolderPrefix('scripts/fill.py')).toBe('scripts/');
    expect(fileFolderPrefix('LICENSE.txt')).toBe('');
  });
});
