import { describe, expect, it } from 'vitest';

import { MAX_INSTRUCTIONS_LENGTH } from '@/common/constants';

import {
  buildCompareFileEntries,
  fileEditKey,
  highlightDifferingWords,
  isDiffableTextFile,
  listTreeFiles,
  pickFileEdits,
  summarizeCompareFiles,
  toFieldText,
  withStoredLineEndings,
} from '../skillCompareFiles.helpers';
import { buildSkillFileTree } from '../skillFiles.helpers';

const text = (path, sha256, size = 10) => ({ path, sha256, size, isText: true });
const binary = (path, sha256) => ({ path, sha256, size: 10, isText: false });

const LEFT = [
  text('references/FORMS.md', 'a'),
  text('scripts/rotate.py', 'b'),
  text('scripts/same.py', 'c'),
  binary('assets/template.pdf', 'd'),
];
const RIGHT = [
  text('references/FORMS.md', 'a2'),
  text('scripts/validate.py', 'e'),
  text('scripts/same.py', 'c'),
  binary('assets/template.pdf', 'd2'),
];

describe('buildCompareFileEntries', () => {
  it('pairs the files of both versions by path and says how each differs', () => {
    const statuses = Object.fromEntries(
      buildCompareFileEntries(LEFT, RIGHT).map(entry => [entry.path, entry.status]),
    );
    expect(statuses).toEqual({
      'references/FORMS.md': 'changed',
      'scripts/rotate.py': 'removed',
      'scripts/same.py': 'same',
      'assets/template.pdf': 'replaced',
      'scripts/validate.py': 'new',
    });
  });

  it('leaves the side without the file empty', () => {
    const entries = buildCompareFileEntries(LEFT, RIGHT);
    expect(entries.find(entry => entry.status === 'new').left).toBeNull();
    expect(entries.find(entry => entry.status === 'removed').right).toBeNull();
  });

  it('calls a text file that became binary replaced', () => {
    const [entry] = buildCompareFileEntries([text('a.bin', 'x')], [binary('a.bin', 'y')]);
    expect(entry.status).toBe('replaced');
  });
});

describe('summarizeCompareFiles', () => {
  it('counts each kind of difference, in a fixed order', () => {
    expect(summarizeCompareFiles(buildCompareFileEntries(LEFT, RIGHT))).toBe(
      '1 changed · 1 new · 1 removed · 1 replaced',
    );
  });

  it('skips the kinds no file has, and is empty when nothing differs', () => {
    expect(summarizeCompareFiles(buildCompareFileEntries([], [text('a.md', 'x')]))).toBe('1 new');
    expect(summarizeCompareFiles(buildCompareFileEntries([text('a.md', 'x')], [text('a.md', 'x')]))).toBe('');
  });
});

describe('file edits', () => {
  it('finds the file texts among the other edits of a version', () => {
    const edits = { instructions: 'new', [fileEditKey('scripts/fill.py')]: 'print(2)' };
    expect(pickFileEdits(edits)).toEqual([
      { key: fileEditKey('scripts/fill.py'), path: 'scripts/fill.py', content: 'print(2)' },
    ]);
  });
});

describe('Windows line endings', () => {
  it('shows the field one line break per line', () => {
    expect(toFieldText('a\r\nb\r\n')).toBe('a\nb\n');
    expect(toFieldText('a\nb\n')).toBe('a\nb\n');
    expect(toFieldText(undefined)).toBeUndefined();
  });

  it('puts them back on the typed text of a file stored with them, and on no other file', () => {
    expect(withStoredLineEndings('a\nb x\n', 'a\r\nb\r\n')).toBe('a\r\nb x\r\n');
    expect(withStoredLineEndings('a\nb x\n', 'a\nb\n')).toBe('a\nb x\n');
  });

  it.each(['a\r\nb\r\n', 'a\nb\n', 'a\r\nb\nc', 'a\rb\r', 'a\n\nb\r\n', ''])(
    'gives back the stored text %j byte for byte when nothing was typed',
    stored => {
      expect(withStoredLineEndings(toFieldText(stored), stored)).toBe(stored);
    },
  );

  it('changes the ending of no other line of a file with mixed endings', () => {
    expect(withStoredLineEndings('a\nbZ\nc', 'a\r\nb\nc')).toBe('a\r\nbZ\nc');
    expect(withStoredLineEndings('a\nbZ\n', 'a\rb\r')).toBe('a\rbZ\r');
  });

  it('keeps the byte order mark out of the field and puts it back on the typed text', () => {
    expect(toFieldText('\uFEFFa\r\nb')).toBe('a\nb');
    expect(withStoredLineEndings('x\nb', '\uFEFFa\r\nb')).toBe('\uFEFFx\r\nb');
    expect(withStoredLineEndings(toFieldText('\uFEFFa\nb\n'), '\uFEFFa\nb\n')).toBe('\uFEFFa\nb\n');
    expect(withStoredLineEndings('x', 'a')).toBe('x');
  });

  it('gives a new line the ending the file uses most', () => {
    expect(withStoredLineEndings('a\nb\nnew\nc\n', 'a\r\nb\r\nc\r\n')).toBe('a\r\nb\r\nnew\r\nc\r\n');
    expect(withStoredLineEndings('x\ny', '')).toBe('x\ny');
  });
});

describe('isDiffableTextFile', () => {
  it('takes text up to the length the Instructions step diffs, and no binary file', () => {
    expect(isDiffableTextFile(text('a.md', 'x', MAX_INSTRUCTIONS_LENGTH))).toBe(true);
    expect(isDiffableTextFile(text('a.md', 'x', MAX_INSTRUCTIONS_LENGTH + 1))).toBe(false);
    expect(isDiffableTextFile(binary('a.pdf', 'x'))).toBe(false);
  });
});

describe('listTreeFiles', () => {
  it('lists the files in the order the tree shows them', () => {
    const root = buildSkillFileTree(buildCompareFileEntries(LEFT, RIGHT));
    expect(listTreeFiles(root).map(file => file.path)).toEqual([
      'assets/template.pdf',
      'references/FORMS.md',
      'scripts/rotate.py',
      'scripts/same.py',
      'scripts/validate.py',
    ]);
  });
});

describe('highlightDifferingWords', () => {
  const differing = segments =>
    segments.filter(segment => segment.type === 'added').map(segment => segment.text);
  const shown = segments => segments.map(segment => segment.text).join('');

  it('marks the words the other text does not have and keeps the whole text', () => {
    const segments = highlightDifferingWords('rect_type: int\nfield: dict', 'rect_type: str\nfield: dict');
    expect(differing(segments)).toEqual(['int']);
    expect(shown(segments)).toBe('rect_type: int\nfield: dict');
  });

  it('marks nothing when the other text is the same or there is no other file', () => {
    expect(differing(highlightDifferingWords('same()', 'same()'))).toEqual([]);
    expect(differing(highlightDifferingWords('validate()', undefined))).toEqual([]);
    expect(highlightDifferingWords('', 'a')).toEqual([]);
  });

  it('marks the whole text against an empty other file', () => {
    expect(differing(highlightDifferingWords('a b', ''))).toEqual(['a b']);
  });

  it('compares only what lies between the shared start and end, so one edit in a long file stays cheap', () => {
    const lines = Array.from({ length: 20000 }, (unused, index) => `word${index}`);
    const other = lines.join(' ');
    const edited = [...lines.slice(0, 10000), 'typed', ...lines.slice(10001)].join(' ');
    const startedAt = performance.now();
    const segments = highlightDifferingWords(edited, other);
    expect(performance.now() - startedAt).toBeLessThan(500);
    expect(differing(segments)).toEqual(['typed']);
    expect(shown(segments)).toBe(edited);
  });

  it('marks the differing stretch as a whole where a word by word comparison would cost too much', () => {
    const left = Array.from({ length: 3000 }, (unused, index) => `a${index}`).join(' ');
    const right = Array.from({ length: 3000 }, (unused, index) => `b${index}`).join(' ');
    const startedAt = performance.now();
    const segments = highlightDifferingWords(`start ${left} end`, `start ${right} end`);
    expect(performance.now() - startedAt).toBeLessThan(500);
    expect(segments).toEqual([
      { type: 'equal', text: 'start ' },
      { type: 'added', text: left },
      { type: 'equal', text: ' end' },
    ]);
  });
});
