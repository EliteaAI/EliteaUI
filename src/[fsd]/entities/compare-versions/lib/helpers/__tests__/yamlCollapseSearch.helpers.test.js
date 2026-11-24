// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { MergeView } from '@codemirror/merge';
import {
  SearchQuery,
  findNext,
  replaceNext,
  search,
  selectMatches,
  setSearchQuery,
} from '@codemirror/search';
import { EditorSelection, EditorState } from '@codemirror/state';

import { collapseUnchangedBlocks, expandBlocksOnSearch } from '../yamlCollapse.helpers';

// jsdom has no layout; CodeMirror measures text with Range rects, so give it empty ones
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [];
  Range.prototype.getBoundingClientRect = () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
  });
}

const lines = (count, prefix) => Array.from({ length: count }, (_, index) => `${prefix}${index}: value`);

// Two long unchanged runs, each 20 lines, separated by changes: both collapse on each side
const buildMergeView = () => {
  const base = ['first: 1', ...lines(20, 'alpha'), 'middle: 1', ...lines(20, 'beta'), 'last: 1'].join('\n');
  const compared = ['first: 2', ...lines(20, 'alpha'), 'middle: 2', ...lines(20, 'beta'), 'last: 2'].join(
    '\n',
  );
  // Several selection ranges only exist when multiple selections are allowed, as in select-all matches
  const extensions = [
    EditorState.allowMultipleSelections.of(true),
    search(),
    collapseUnchangedBlocks(),
    expandBlocksOnSearch(),
  ];
  return new MergeView({
    a: { doc: base, extensions },
    b: { doc: compared, extensions },
    parent: document.body,
    highlightChanges: true,
  });
};

const collapsedRows = view => view.dom.querySelectorAll('.cm-collapsedLines').length;
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('expandBlocksOnSearch', () => {
  it('opens the collapsed block on both sides when a match is inside it', async () => {
    const mergeView = buildMergeView();
    expect(collapsedRows(mergeView.a)).toBe(2);
    expect(collapsedRows(mergeView.b)).toBe(2);

    mergeView.a.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: 'alpha10:' })) });
    findNext(mergeView.a);
    await flush();

    expect(collapsedRows(mergeView.a)).toBe(1);
    expect(collapsedRows(mergeView.b)).toBe(1);
    mergeView.destroy();
  });

  it('leaves collapsed blocks alone when the match is on a visible line', async () => {
    const mergeView = buildMergeView();

    mergeView.a.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: 'first' })) });
    findNext(mergeView.a);
    await flush();

    expect(collapsedRows(mergeView.a)).toBe(2);
    expect(collapsedRows(mergeView.b)).toBe(2);
    mergeView.destroy();
  });

  it('opens every block that holds a match when all matches are selected', async () => {
    const mergeView = buildMergeView();

    mergeView.a.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: 'value' })) });
    selectMatches(mergeView.a);
    await flush();

    expect(collapsedRows(mergeView.a)).toBe(0);
    expect(collapsedRows(mergeView.b)).toBe(0);
    mergeView.destroy();
  });

  it('opens a block that a secondary selection range reaches, not only the main range', async () => {
    const mergeView = buildMergeView();
    const hiddenPos = mergeView.a.state.doc.line(10).from;

    mergeView.a.dispatch({
      selection: EditorSelection.create([EditorSelection.cursor(0), EditorSelection.cursor(hiddenPos)], 0),
      userEvent: 'select.search.matches',
    });
    await flush();

    expect(collapsedRows(mergeView.a)).toBe(1);
    expect(collapsedRows(mergeView.b)).toBe(1);
    mergeView.destroy();
  });

  it('opens the block a replace moves the selection into', async () => {
    const mergeView = buildMergeView();
    const hiddenPos = mergeView.a.state.doc.line(10).from;

    mergeView.a.dispatch({
      selection: EditorSelection.cursor(hiddenPos),
      userEvent: 'input.replace',
    });
    await flush();

    expect(collapsedRows(mergeView.a)).toBe(1);
    expect(collapsedRows(mergeView.b)).toBe(1);
    mergeView.destroy();
  });

  it('replaces the current match through the replace command and keeps the block open', async () => {
    const mergeView = buildMergeView();
    mergeView.a.dispatch({
      effects: setSearchQuery.of(new SearchQuery({ search: 'alpha10:', replace: 'gamma10:' })),
    });
    findNext(mergeView.a);
    await flush();
    replaceNext(mergeView.a);
    await flush();

    expect(mergeView.a.state.doc.toString()).toContain('gamma10: value');
    expect(collapsedRows(mergeView.a)).toBe(1);
    mergeView.destroy();
  });
});
