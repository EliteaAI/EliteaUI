// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, render } from '@testing-library/react';
import { EditorView, ExternalChange } from '@uiw/react-codemirror';

import CodeMirrorEditor from '../CodeMirrorEditor';

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useCodeMirror: ({ value }) => ({
    code: value,
    setCode: () => {},
    isDarkMode: false,
    basicExtensions: [],
    onInputHandler: () => {},
  }),
}));

const PREFIX = '>>>';
const countTextAfterPrefix = text => (text.startsWith(PREFIX) ? text.length - PREFIX.length : text.length);

const HEADER_MARK = '>';
const countTextBelowHeader = text =>
  text.startsWith(HEADER_MARK) ? text.length - text.indexOf('\n') - 1 : text.length;

const replaceAll = (view, insert) => {
  act(() => {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert }, userEvent: 'input.paste' });
  });
};

const renderEditor = props => {
  const { container } = render(
    <CodeMirrorEditor
      variant="body1"
      {...props}
    />,
  );
  return EditorView.findFromDOM(container.querySelector('.cm-editor'));
};

const insertAt = (view, from, insert) => {
  act(() => {
    view.dispatch({ changes: { from, insert }, userEvent: 'input.type' });
  });
};

describe('CodeMirrorEditor maxLength', () => {
  afterEach(() => cleanup());

  it('cuts an insertion at the document length by default', () => {
    const view = renderEditor({ value: 'abc', maxLength: 5 });

    insertAt(view, 3, 'defg');

    expect(view.state.doc.toString()).toBe('abcde');
  });

  it('measures the limit with countLength and leaves uncounted text free', () => {
    const view = renderEditor({ value: `${PREFIX}abc`, maxLength: 5, countLength: countTextAfterPrefix });

    insertAt(view, PREFIX.length + 3, 'defg');

    expect(view.state.doc.toString()).toBe(`${PREFIX}abcde`);
  });

  it('allows typing in uncounted text when the counted text is at the limit', () => {
    const view = renderEditor({
      value: `${PREFIX}abcde`,
      maxLength: 5,
      countLength: text => text.length - text.indexOf('a'),
    });

    insertAt(view, 0, 'xx');

    expect(view.state.doc.toString()).toBe(`xx${PREFIX}abcde`);
  });

  it('keeps a programmatic value that goes over the limit', () => {
    const view = renderEditor({ value: 'abc', maxLength: 5 });

    act(() => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: 'abcdefgh' },
        annotations: [ExternalChange.of(true)],
      });
    });

    expect(view.state.doc.toString()).toBe('abcdefgh');
  });

  it('applies a deletion in a document that is still over the limit', () => {
    const view = renderEditor({ value: 'abcdefg', maxLength: 5 });

    act(() => {
      view.dispatch({ changes: { from: 6, to: 7 }, userEvent: 'delete' });
    });

    expect(view.state.doc.toString()).toBe('abcdef');
  });

  it.each([
    ['plain text over a header', '>head\nabc', 'x'.repeat(20), 'x'.repeat(10)],
    ['a short header over a long one', '>long header\nabc', `>h\n${'y'.repeat(20)}`, `>h\n${'y'.repeat(10)}`],
    [
      'a long header over a short one',
      '>h\nabc',
      `>much longer header\n${'z'.repeat(15)}`,
      `>much longer header\n${'z'.repeat(10)}`,
    ],
  ])('measures a paste of %s against the pasted header', (_case, value, pasted, expected) => {
    const view = renderEditor({ value, maxLength: 10, countLength: countTextBelowHeader });

    replaceAll(view, pasted);

    expect(view.state.doc.toString()).toBe(expected);
  });

  it('allows editing uncounted text while the counted text is already over the limit', () => {
    const value = `>h\n${'b'.repeat(12)}`;
    const view = renderEditor({ value, maxLength: 10, countLength: countTextBelowHeader });

    insertAt(view, 1, 'xx');
    insertAt(view, view.state.doc.length, 'c');

    expect(view.state.doc.toString()).toBe(`>xxh\n${'b'.repeat(12)}`);
  });
});
