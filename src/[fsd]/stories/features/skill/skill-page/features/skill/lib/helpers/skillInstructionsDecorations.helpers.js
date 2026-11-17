import { Decoration, EditorView, ViewPlugin } from '@codemirror/view';

export const MENTION_LINE_CLASS = 'cm-skill-mention-line';
export const FILE_LINK_CLASS = 'cm-skill-file-link';

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDecorations = (view, paths, markedLines) => {
  const ranges = [];
  const { doc } = view.state;
  markedLines.forEach(lineNumber => {
    if (lineNumber <= doc.lines) {
      const line = doc.line(lineNumber);
      ranges.push(Decoration.line({ class: MENTION_LINE_CLASS }).range(line.from));
    }
  });
  if (paths.length) {
    const pattern = new RegExp(paths.map(escapeRegExp).join('|'), 'g');
    const text = doc.toString();
    for (const match of text.matchAll(pattern)) {
      ranges.push(
        Decoration.mark({ class: FILE_LINK_CLASS, attributes: { 'data-path': match[0] } }).range(
          match.index,
          match.index + match[0].length,
        ),
      );
    }
  }
  return Decoration.set(ranges, true);
};

// Lines that mention the open file get a background; every path of a skill file is a link that opens it
export const skillInstructionsDecorations = ({ paths = [], markedLines = [], onOpenFile }) => [
  ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = buildDecorations(view, paths, markedLines);
      }

      update(update) {
        if (update.docChanged) this.decorations = buildDecorations(update.view, paths, markedLines);
      }
    },
    { decorations: plugin => plugin.decorations },
  ),
  EditorView.domEventHandlers({
    mousedown: event => {
      const link = event.target.closest?.(`.${FILE_LINK_CLASS}`);
      if (!link || !onOpenFile) return false;
      event.preventDefault();
      onOpenFile(link.getAttribute('data-path'));
      return true;
    },
  }),
];
