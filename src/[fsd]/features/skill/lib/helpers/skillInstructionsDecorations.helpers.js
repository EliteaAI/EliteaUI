import { Decoration, EditorView, ViewPlugin } from '@codemirror/view';

import { findMentionLines, findPathMentions } from './skillFiles.helpers';

export const MENTION_LINE_CLASS = 'cm-skill-mention-line';
export const FILE_LINK_CLASS = 'cm-skill-file-link';

const isMac = () => /Mac|iPhone|iPad/.test(globalThis.navigator?.platform ?? '');

const editableLinkHint = () => (isMac() ? '⌘-click to open' : 'Ctrl-click to open');

const buildDecorations = (view, paths, openPath) => {
  const { doc } = view.state;
  const text = doc.toString();
  const linkTitle = view.state.readOnly ? undefined : editableLinkHint();
  const lineRanges = findMentionLines(text, openPath).map(lineNumber =>
    Decoration.line({ class: MENTION_LINE_CLASS }).range(doc.line(lineNumber).from),
  );
  const linkRanges = findPathMentions(text, paths).map(({ path, from, to }) =>
    Decoration.mark({
      class: FILE_LINK_CLASS,
      attributes: { 'data-path': path, ...(linkTitle && { title: linkTitle }) },
    }).range(from, to),
  );
  return Decoration.set([...lineRanges, ...linkRanges], true);
};

const isOpenGesture = (event, view) =>
  event.button === 0 && (view.state.readOnly || (isMac() ? event.metaKey : event.ctrlKey));

/**
 * Lines that mention the open file get a background; every path of a skill file is a link that opens it. While the
 * text is editable a plain click places the cursor, so the link opens on ⌘-click on a Mac and Ctrl-click elsewhere.
 */
export const skillInstructionsDecorations = ({ paths = [], openPath, onOpenFile }) => [
  ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = buildDecorations(view, paths, openPath);
      }

      update(update) {
        if (update.docChanged || update.startState.readOnly !== update.state.readOnly)
          this.decorations = buildDecorations(update.view, paths, openPath);
      }
    },
    { decorations: plugin => plugin.decorations },
  ),
  EditorView.domEventHandlers({
    mousedown: (event, view) => {
      const link = event.target.closest?.(`.${FILE_LINK_CLASS}`);
      if (!link || !onOpenFile || !isOpenGesture(event, view)) return false;
      event.preventDefault();
      onOpenFile(link.getAttribute('data-path'));
      return true;
    },
  }),
];
