import { useCallback, useEffect, useRef, useState } from 'react';

import { useTheme } from '@mui/material';

import { useEliteATheme } from '@/[fsd]/shared/lib/hooks/useEliteATheme.hooks';
import { history, historyKeymap } from '@codemirror/commands';
import { StreamLanguage, defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { MergeView } from '@codemirror/merge';
import { EditorView, GutterMarker, gutter, keymap, lineNumbers } from '@codemirror/view';
import { vscodeDarkInit, vscodeLightInit } from '@uiw/codemirror-theme-vscode';

import { YAML_DIFF } from '../constants/compareVersions.constants';
import { collapseUnchangedBlocks } from '../helpers/yamlCollapse.helpers';

// A gutter mark that shows a change without colour: − on the base side, + on the compared side
class ChangeSignMarker extends GutterMarker {
  constructor(sign) {
    super();
    this.sign = sign;
  }

  eq(other) {
    return other.sign === this.sign;
  }

  toDOM() {
    const element = document.createElement('span');
    element.textContent = this.sign;
    element.setAttribute('aria-hidden', 'true');
    return element;
  }
}

const changedLineNumbers = (view, chunks, side) => {
  const numbers = new Set();
  chunks.forEach(chunk => {
    const from = side === 'a' ? chunk.fromA : chunk.fromB;
    const to = side === 'a' ? chunk.toA : chunk.toB;
    if (to <= from) return;
    const doc = view.state.doc;
    const first = doc.lineAt(Math.min(from, doc.length)).number;
    const last = doc.lineAt(Math.min(Math.max(to - 1, from), doc.length)).number;
    for (let line = first; line <= last; line++) numbers.add(line);
  });
  return numbers;
};

const changeSignGutter = (side, getChunks) => {
  const marker = new ChangeSignMarker(side === 'a' ? '−' : '+');
  // The changed lines are worked out once per set of chunks, not once per gutter line
  let cachedChunks = null;
  let cachedNumbers = new Set();
  return gutter({
    class: 'cm-changeSignGutter',
    lineMarker: (view, line) => {
      const chunks = getChunks();
      if (chunks !== cachedChunks) {
        cachedChunks = chunks;
        cachedNumbers = changedLineNumbers(view, chunks, side);
      }
      return cachedNumbers.has(view.state.doc.lineAt(line.from).number) ? marker : null;
    },
    lineMarkerChange: update => update.docChanged || update.transactions.some(tr => tr.effects.length),
    initialSpacer: () => marker,
  });
};

const buildDiffTheme = (palette, isDarkMode) =>
  EditorView.theme(
    {
      // The editors grow with their text; the merge view around them is the one scroller, so both scroll together
      '&': { fontSize: '0.8125rem' },
      // The card around both editors shows the focus, so the editor draws none of its own
      '&.cm-focused': { outline: 'none' },
      '.cm-scroller': { fontFamily: 'monospace', overflow: 'visible' },
      '.cm-gutters': { backgroundColor: palette.background.default.tertiary, border: 'none' },
      '&.cm-merge-a .cm-changedLine, .cm-deletedChunk': { backgroundColor: palette.diff.removed },
      '&.cm-merge-b .cm-changedLine': { backgroundColor: palette.diff.added },
      // The words that differ inside a changed line carry a second, darker mark
      '&.cm-merge-a .cm-changedText': {
        background: `linear-gradient(${palette.diff.removed}, ${palette.diff.removed})`,
        backgroundColor: palette.diff.removed,
        textDecoration: 'none',
      },
      '&.cm-merge-b .cm-changedText': {
        background: `linear-gradient(${palette.diff.added}, ${palette.diff.added})`,
        backgroundColor: palette.diff.added,
        textDecoration: 'none',
      },
      '.cm-changeSignGutter .cm-gutterElement': {
        width: '1rem',
        textAlign: 'center',
        color: palette.text.primary,
        fontWeight: 600,
      },
      '.cm-collapsedLines': {
        cursor: 'pointer',
        padding: '0.25rem 1rem',
        color: palette.text.primary,
        backgroundColor: palette.background.default.secondary,
        backgroundImage: 'none',
        fontFamily: 'inherit',
      },
      '.cm-collapsedLines:hover': { backgroundColor: palette.background.default.tertiary },
      '.cm-collapsedLines:focus-visible': { outline: `0.125rem solid ${palette.primary.main}` },
      '.cm-mergeSpacer': { backgroundColor: palette.background.default.secondary },
    },
    { dark: isDarkMode },
  );

const readChunks = mergeView => mergeView?.chunks ?? [];

// The chunks with the two texts they were computed for, so line counts never mix two edits
const snapshotOf = mergeView => ({
  chunks: readChunks(mergeView),
  a: mergeView?.a.state.doc.toString() ?? '',
  b: mergeView?.b.state.doc.toString() ?? '',
});

const EMPTY_SNAPSHOT = { chunks: [], a: '', b: '' };

/**
 * Owns a side-by-side CodeMirror MergeView: both sides editable, line diff with word marks inside changed
 * lines, aligned gaps, collapsed unchanged blocks and synced scrolling. The view is created once and keeps
 * its expanded blocks while the texts are edited.
 *
 * `diff` is published when the view opens, then 500 ms after the last edit.
 * @returns {{ hostRef, diff: { chunks: Array, a: string, b: string }, scrollToChunk: Function, scrollToLines: Function }}
 */
export const useYamlMergeView = ({ leftValue, rightValue, onLeftChange, onRightChange, enabled = true }) => {
  const theme = useTheme();
  const { isDarkMode } = useEliteATheme();
  const hostRef = useRef(null);
  const mergeViewRef = useRef(null);
  const onLeftChangeRef = useRef(onLeftChange);
  const onRightChangeRef = useRef(onRightChange);
  const [diff, setDiff] = useState(EMPTY_SNAPSHOT);
  const debounceRef = useRef(null);

  useEffect(() => {
    onLeftChangeRef.current = onLeftChange;
    onRightChangeRef.current = onRightChange;
  }, [onLeftChange, onRightChange]);

  useEffect(() => {
    if (!enabled || !hostRef.current) return undefined;
    const host = hostRef.current;
    const getChunks = () => readChunks(mergeViewRef.current);
    const editorTheme = (isDarkMode ? vscodeDarkInit : vscodeLightInit)({
      settings: { background: theme.palette.background.default.primary },
    });
    const sharedExtensions = [
      // Long lines wrap inside their column instead of running under its right edge
      EditorView.lineWrapping,
      lineNumbers(),
      history(),
      keymap.of(historyKeymap),
      StreamLanguage.define(yaml),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      editorTheme,
      buildDiffTheme(theme.palette, isDarkMode),
      // The library's own collapse counts the kept lines into its limit; this one follows the spec
      collapseUnchangedBlocks(),
    ];
    const changeListener = onChangeRef =>
      EditorView.updateListener.of(update => {
        if (!update.docChanged) return;
        onChangeRef.current?.(update.state.doc.toString());
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(
          () => setDiff(snapshotOf(mergeViewRef.current)),
          YAML_DIFF.DEBOUNCE_MS,
        );
      });

    const mergeView = new MergeView({
      a: {
        doc: leftValue,
        extensions: [
          ...sharedExtensions,
          changeSignGutter('a', getChunks),
          changeListener(onLeftChangeRef),
          EditorView.contentAttributes.of({
            'aria-label': 'Base version YAML',
            'data-testid': 'compare-yaml-left',
          }),
        ],
      },
      b: {
        doc: rightValue,
        extensions: [
          ...sharedExtensions,
          changeSignGutter('b', getChunks),
          changeListener(onRightChangeRef),
          EditorView.contentAttributes.of({
            'aria-label': 'Compared version YAML',
            'data-testid': 'compare-yaml-right',
          }),
        ],
      },
      parent: host,
      gutter: true,
      highlightChanges: true,
      diffConfig: { scanLimit: 10000, timeout: 1500 },
    });
    mergeViewRef.current = mergeView;
    setDiff(snapshotOf(mergeView));

    return () => {
      clearTimeout(debounceRef.current);
      mergeView.destroy();
      mergeViewRef.current = null;
    };
    // The view is built once per mount; later text changes come from the editors themselves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isDarkMode]);

  // A save or a copy outside the editors replaces that side's text
  const syncSide = useCallback((view, value) => {
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, []);

  useEffect(() => {
    syncSide(mergeViewRef.current?.a, leftValue);
  }, [leftValue, syncSide]);

  useEffect(() => {
    syncSide(mergeViewRef.current?.b, rightValue);
  }, [rightValue, syncSide]);

  const scrollToPositions = useCallback((positionA, positionB) => {
    const mergeView = mergeViewRef.current;
    if (!mergeView) return;
    const effectA = EditorView.scrollIntoView(Math.min(positionA, mergeView.a.state.doc.length), {
      y: 'center',
    });
    const effectB = EditorView.scrollIntoView(Math.min(positionB, mergeView.b.state.doc.length), {
      y: 'center',
    });
    mergeView.a.dispatch({ effects: effectA });
    mergeView.b.dispatch({ effects: effectB });
  }, []);

  const scrollToChunk = useCallback(
    index => {
      const chunk = readChunks(mergeViewRef.current)[index];
      if (chunk) scrollToPositions(chunk.fromA, chunk.fromB);
    },
    [scrollToPositions],
  );

  // Scrolls each side to a line (1-based); a missing line keeps that side where it is
  const scrollToLines = useCallback((lineA, lineB) => {
    const mergeView = mergeViewRef.current;
    if (!mergeView) return;
    [
      [mergeView.a, lineA],
      [mergeView.b, lineB],
    ].forEach(([view, line]) => {
      if (!line || line > view.state.doc.lines) return;
      view.dispatch({ effects: EditorView.scrollIntoView(view.state.doc.line(line).from, { y: 'center' }) });
    });
  }, []);

  return { hostRef, diff, scrollToChunk, scrollToLines };
};
