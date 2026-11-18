import { describe, expect, it } from 'vitest';

import {
  buildRunVersionSearch,
  buildSkillFileTree,
  describeSkillFiles,
  findMentionLines,
  findPathMentions,
  findSkillFile,
  resolveFileLink,
} from '../skillFiles.helpers';

const FILES = [
  { path: 'scripts/fill.py' },
  { path: 'references/FORMS.md' },
  { path: 'scripts/lib/pdf.py' },
  { path: 'scripts/lib/form.py' },
  { path: 'assets/template.pdf' },
  { path: 'LICENSE.txt' },
];

describe('buildSkillFileTree', () => {
  it('nests folders and sorts each level by name, folders before files', () => {
    const root = buildSkillFileTree(FILES);
    expect(root.folders.map(folder => folder.path)).toEqual(['assets', 'references', 'scripts']);
    const scripts = root.folders[2];
    expect(scripts.folders.map(folder => [folder.path, folder.name])).toEqual([['scripts/lib', 'lib']]);
    expect(scripts.files.map(file => file.path)).toEqual(['scripts/fill.py']);
    expect(scripts.folders[0].files.map(file => file.path)).toEqual([
      'scripts/lib/form.py',
      'scripts/lib/pdf.py',
    ]);
    expect(root.files.map(file => file.path)).toEqual(['LICENSE.txt']);
  });
});

describe('describeSkillFiles', () => {
  it('counts every file under a top-level folder, nested ones included', () => {
    expect(describeSkillFiles(FILES)).toBe('Assets 1 · References 1 · Scripts 3 · Other 1');
  });
});

describe('findPathMentions', () => {
  it('matches whole paths only', () => {
    expect(findPathMentions('see data.md and a.md', ['a.md'])).toEqual([{ path: 'a.md', from: 16, to: 20 }]);
    expect(findPathMentions('see scripts/a.md', ['a.md'])).toEqual([]);
    expect(findPathMentions('see a.mdx', ['a.md'])).toEqual([]);
  });

  it('does not link a shorter path inside a longer one', () => {
    expect(findPathMentions('run scripts/a.py', ['a.py', 'scripts/a.py'])).toEqual([
      { path: 'scripts/a.py', from: 4, to: 16 },
    ]);
  });

  it('accepts a sentence end, a ./ prefix and Markdown link syntax', () => {
    expect(findPathMentions('Run a.py.', ['a.py'])).toHaveLength(1);
    expect(findPathMentions('Run ./a.py', ['a.py'])).toHaveLength(1);
    expect(findPathMentions('[guide](references/g.md)', ['references/g.md'])).toHaveLength(1);
  });
});

describe('findMentionLines', () => {
  it('finds the instruction lines that mention a file as a whole path', () => {
    const text = '# PDF\n1. Read references/FORMS.md.\n2. Run scripts/fill.py.\n3. Not myscripts/fill.py';
    expect(findMentionLines(text, 'scripts/fill.py')).toEqual([3]);
    expect(findMentionLines(text, 'LICENSE.txt')).toEqual([]);
  });
});

describe('findSkillFile', () => {
  it('matches exactly first, then case-insensitively, as the backend does', () => {
    expect(findSkillFile(FILES, 'references/forms.md')?.path).toBe('references/FORMS.md');
    expect(findSkillFile(FILES, 'nope.md')).toBeNull();
    expect(findSkillFile(FILES, null)).toBeNull();
  });
});

describe('resolveFileLink', () => {
  it('resolves relative links to skill files', () => {
    expect(resolveFileLink(FILES, './references/FORMS.md#top')?.path).toBe('references/FORMS.md');
    expect(resolveFileLink(FILES, 'scripts/lib/pdf.py')?.path).toBe('scripts/lib/pdf.py');
    expect(resolveFileLink([{ path: 'a b.md' }], 'a%20b.md')?.path).toBe('a b.md');
  });

  it('leaves other links alone', () => {
    expect(resolveFileLink(FILES, 'https://example.com/LICENSE.txt')).toBeNull();
    expect(resolveFileLink(FILES, '#section')).toBeNull();
    expect(resolveFileLink(FILES, '/LICENSE.txt')).toBeNull();
    expect(resolveFileLink(FILES, 'missing.md')).toBeNull();
  });
});

describe('buildRunVersionSearch', () => {
  it('keeps the tab and the side panel for the run, and leaves the open file and anything else behind', () => {
    const current = new URLSearchParams(
      'view=files&file=scripts%2Ffill.py&panel=instructions&run=4&focus=run',
    );
    expect(buildRunVersionSearch(current, 9).toString()).toBe('run=9&view=files&panel=instructions');
  });

  it('adds only the run when the address names no tab or panel', () => {
    expect(buildRunVersionSearch(new URLSearchParams(''), 9).toString()).toBe('run=9');
  });
});
