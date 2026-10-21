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
    view.dispatch({ changes: { from, insert } });
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
});
