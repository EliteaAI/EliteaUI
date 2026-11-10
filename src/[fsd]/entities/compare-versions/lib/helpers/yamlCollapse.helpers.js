import { getChunks, mergeViewSiblings } from '@codemirror/merge';
import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

import { YAML_DIFF } from '../constants/compareVersions.constants';

const MARGIN = YAML_DIFF.COLLAPSE_MARGIN;
const MAX_UNCOLLAPSED = YAML_DIFF.MAX_UNCOLLAPSED_LINES;

// Expands the collapsed block that starts at the given document position
const expandBlock = StateEffect.define({ map: (value, changes) => changes.mapPos(value) });

/**
 * The line ranges to hide in one editor of a merge view. An unchanged block longer than 6 lines
 * collapses: between two changes its first and last 3 lines stay; at the start or end of the file only
 * the 3 lines next to the change stay. A block of 6 lines or fewer never collapses, nor does a file
 * without changes.
 *
 * @param {{ lines: number, lineAt: (pos: number) => { number: number } }} doc
 * @param {Array<{ from: number, to: number }>} chunks changed ranges of this editor, in document order
 * @returns {{ fromLine: number, toLine: number }[]}
 */
export const getCollapsedLineRanges = (doc, chunks) => {
  if (!chunks.length) return [];
  const ranges = [];
  // The first line after the previous change; before any change, the first line of the file
  let nextLine = 1;
  for (let index = 0; index <= chunks.length; index++) {
    const chunk = chunks[index];
    const isFileStart = index === 0;
    const isFileEnd = !chunk;
    const blockEnd = isFileEnd ? doc.lines : doc.lineAt(chunk.from).number - 1;
    const blockLines = blockEnd - nextLine + 1;
    if (blockLines > MAX_UNCOLLAPSED) {
      const fromLine = isFileStart ? 1 : nextLine + MARGIN;
      const toLine = isFileEnd ? doc.lines : blockEnd - MARGIN;
      if (toLine >= fromLine) ranges.push({ fromLine, toLine });
    }
    if (isFileEnd) break;
    // `to` is one past the last changed line, so the line at it is the first unchanged one
    const after = Math.min(chunk.to, doc.length);
    nextLine =
      chunk.to > chunk.from && chunk.to <= doc.length
        ? doc.lineAt(after).number
        : doc.lineAt(after).number + 1;
  }
  return ranges;
};

const sideChunks = (state, info) =>
  info.chunks.map(chunk =>
    info.side === 'a' ? { from: chunk.fromA, to: chunk.toA } : { from: chunk.fromB, to: chunk.toB },
  );

// The position in the other editor that matches `pos` in this one, across the changes between them
const mapToSibling = (pos, info) => {
  const isA = info.side === 'a';
  let ownStart = 0;
  let otherStart = 0;
  for (const chunk of info.chunks) {
    if ((isA ? chunk.fromA : chunk.fromB) >= pos) break;
    ownStart = isA ? chunk.toA : chunk.toB;
    otherStart = isA ? chunk.toB : chunk.toA;
  }
  return otherStart + (pos - ownStart);
};

class CollapsedBlockWidget extends WidgetType {
  constructor(lines) {
    super();
    this.lines = lines;
  }

  eq(other) {
    return other.lines === this.lines;
  }

  toDOM(view) {
    const row = document.createElement('div');
    row.className = 'cm-collapsedLines';
    row.textContent = `Show ${this.lines} unchanged lines`;
    // Reachable and usable by keyboard
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    const expand = () => {
      const pos = view.posAtDOM(row);
      view.dispatch({ effects: expandBlock.of(pos) });
      // The block opens on both sides at once
      const info = getChunks(view.state);
      const siblings = mergeViewSiblings(view);
      const sibling = siblings && (siblings.a === view ? siblings.b : siblings.a);
      if (sibling && info) sibling.dispatch({ effects: expandBlock.of(mapToSibling(pos, info)) });
    };
    row.addEventListener('click', expand);
    row.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      expand();
    });
    return row;
  }

  ignoreEvent(event) {
    return event instanceof MouseEvent || event instanceof KeyboardEvent;
  }

  get estimatedHeight() {
    return 27;
  }
}

const buildDecorations = state => {
  const info = getChunks(state);
  if (!info) return null;
  const builder = new RangeSetBuilder();
  getCollapsedLineRanges(state.doc, sideChunks(state, info)).forEach(({ fromLine, toLine }) => {
    builder.add(
      state.doc.line(fromLine).from,
      state.doc.line(toLine).to,
      Decoration.replace({ widget: new CollapsedBlockWidget(toLine - fromLine + 1), block: true }),
    );
  });
  return builder.finish();
};

/**
 * Collapses long unchanged blocks of a MergeView editor. The blocks are worked out once, when the merge
 * view has its first diff; a block the user opens stays open until the dialog closes, also after edits.
 */
export const collapseUnchangedBlocks = () =>
  StateField.define({
    create: () => ({ isBuilt: false, deco: Decoration.none }),
    update: (value, tr) => {
      if (!value.isBuilt) {
        const deco = buildDecorations(tr.state);
        return deco ? { isBuilt: true, deco } : value;
      }
      let deco = value.deco.map(tr.changes);
      tr.effects.forEach(effect => {
        if (effect.is(expandBlock)) deco = deco.update({ filter: from => from !== effect.value });
      });
      // A block that a new change reaches opens, as the hidden lines are no longer unchanged
      const info = getChunks(tr.state);
      if (info && deco.size) {
        const touched = [];
        sideChunks(tr.state, info).forEach(chunk =>
          deco.between(chunk.from, chunk.to, from => touched.push(from)),
        );
        if (touched.length) deco = deco.update({ filter: from => !touched.includes(from) });
      }
      return deco === value.deco ? value : { isBuilt: true, deco };
    },
    provide: field => EditorView.decorations.from(field, value => value.deco),
  });
