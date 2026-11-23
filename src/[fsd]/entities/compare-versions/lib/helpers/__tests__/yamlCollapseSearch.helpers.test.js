// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { MergeView } from '@codemirror/merge';
import { SearchQuery, findNext, search, setSearchQuery } from '@codemirror/search';

import { collapseUnchangedBlocks, expandBlocksOnSearch } from '../yamlCollapse.helpers';

const lines = (count, prefix) => Array.from({ length: count }, (_, index) => `${prefix}${index}: value`);

const buildMergeView = () => {
  // 20 unchanged lines between two changes, so the middle collapses
  const shared = lines(20, 'common');
  const base = ['first: 1', ...shared, 'last: 1'].join('\n');
  const compared = ['first: 2', ...shared, 'last: 2'].join('\n');
  const extensions = [search(), collapseUnchangedBlocks(), expandBlocksOnSearch()];
  return new MergeView({
    a: { doc: base, extensions },
    b: { doc: compared, extensions },
    parent: document.body,
    highlightChanges: true,
  });
};

const collapsedRows = view => view.dom.querySelectorAll('.cm-collapsedLines').length;

describe('expandBlocksOnSearch', () => {
  it('opens the collapsed block on both sides when a match is inside it', async () => {
    const mergeView = buildMergeView();
    expect(collapsedRows(mergeView.a)).toBe(1);
    expect(collapsedRows(mergeView.b)).toBe(1);

    mergeView.a.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: 'common10:' })) });
    findNext(mergeView.a);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(collapsedRows(mergeView.a)).toBe(0);
    expect(collapsedRows(mergeView.b)).toBe(0);
    mergeView.destroy();
  });

  it('leaves collapsed blocks alone when the match is on a visible line', async () => {
    const mergeView = buildMergeView();

    mergeView.a.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: 'first' })) });
    findNext(mergeView.a);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(collapsedRows(mergeView.a)).toBe(1);
    expect(collapsedRows(mergeView.b)).toBe(1);
    mergeView.destroy();
  });
});
