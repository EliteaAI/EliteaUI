// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import {
  FILE_LINK_CLASS,
  MENTION_LINE_CLASS,
  skillInstructionsDecorations,
} from '../skillInstructionsDecorations.helpers';

const TEXT = '# PDF\nRun scripts/fill.py now.\nThen read FORMS.md.';
const PATHS = ['scripts/fill.py', 'FORMS.md'];

let view;
const readOnlyCompartment = new Compartment();

const onPlatform = platform => vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);

const mount = ({ readOnly = false, openPath, onOpenFile = vi.fn() } = {}) => {
  view = new EditorView({
    state: EditorState.create({
      doc: TEXT,
      extensions: [
        readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
        skillInstructionsDecorations({ paths: PATHS, openPath, onOpenFile }),
      ],
    }),
    parent: document.body,
  });
  return onOpenFile;
};

const linkOf = path => view.dom.querySelector(`.${FILE_LINK_CLASS}[data-path="${path}"]`);

const pressOnLink = (path, init = {}) =>
  linkOf(path).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, ...init }));

describe('skillInstructionsDecorations', () => {
  afterEach(() => {
    view?.destroy();
    view = null;
    vi.restoreAllMocks();
  });

  it('leaves a plain click on a path to the editor while the text is editable', () => {
    const onOpenFile = mount();
    pressOnLink('FORMS.md');
    expect(onOpenFile).not.toHaveBeenCalled();
  });

  it('opens the file on Ctrl-click outside a Mac, and not on the Windows key', () => {
    onPlatform('Win32');
    const onOpenFile = mount();
    pressOnLink('scripts/fill.py', { metaKey: true });
    pressOnLink('FORMS.md', { ctrlKey: true });
    expect(onOpenFile.mock.calls).toEqual([['FORMS.md']]);
    expect(linkOf('FORMS.md')).toHaveProperty('title', 'Ctrl-click to open');
  });

  it('opens the file on ⌘-click on a Mac, where Ctrl-click is the context menu', () => {
    onPlatform('MacIntel');
    const onOpenFile = mount();
    pressOnLink('FORMS.md', { ctrlKey: true });
    pressOnLink('scripts/fill.py', { metaKey: true });
    expect(onOpenFile.mock.calls).toEqual([['scripts/fill.py']]);
    expect(linkOf('FORMS.md')).toHaveProperty('title', '⌘-click to open');
  });

  it('opens the file on a plain click when the text is read-only, but not on a right click', () => {
    const onOpenFile = mount({ readOnly: true });
    pressOnLink('scripts/fill.py', { button: 2 });
    pressOnLink('FORMS.md');
    expect(onOpenFile.mock.calls).toEqual([['FORMS.md']]);
  });

  it('drops the click hint when the text turns read-only after it is shown', () => {
    onPlatform('Win32');
    mount();
    expect(linkOf('FORMS.md')).toHaveProperty('title', 'Ctrl-click to open');

    view.dispatch({ effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(true)) });
    expect(linkOf('FORMS.md')).toHaveProperty('title', '');
  });

  it('marks the lines that mention the open file, also after an edit', () => {
    mount({ openPath: 'FORMS.md' });
    const markedText = () =>
      Array.from(view.dom.querySelectorAll(`.${MENTION_LINE_CLASS}`)).map(line => line.textContent);
    expect(markedText()).toEqual(['Then read FORMS.md.']);

    view.dispatch({ changes: { from: 0, insert: 'See FORMS.md.\n' } });
    expect(markedText()).toEqual(['See FORMS.md.', 'Then read FORMS.md.']);
  });
});
