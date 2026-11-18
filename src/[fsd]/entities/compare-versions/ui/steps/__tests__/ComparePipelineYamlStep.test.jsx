// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import { EditorView, runScopeHandlers } from '@codemirror/view';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/[fsd]/shared/lib/hooks/useEliteATheme.hooks', () => ({
  useEliteATheme: () => ({ isDarkMode: true }),
}));
vi.mock('@/[fsd]/shared/ui/button', () => ({
  CopyIconButton: props => (
    <button
      type="button"
      aria-label={props.tooltip}
    />
  ),
}));
vi.mock('@/[fsd]/entities/version', () => ({ buildVersionOption: vi.fn(), formatVersionMeta: vi.fn() }));
vi.mock('@/[fsd]/shared/ui', () => ({
  Banner: { BannerMessage: props => <div role="status">{props.message}</div> },
  Field: { CodeMirrorEditor: props => <div data-testid={props.contentTestId}>{props.value}</div> },
}));
vi.mock('@/[fsd]/entities/edit-entity-with-ai', () => ({
  EditEntityComparisonLayout: props => (
    <div>
      {props.currentLabel}
      {props.suggestedLabel}
    </div>
  ),
}));

// jsdom has no layout; CodeMirror measures text ranges once its timers run
const emptyRects = () => Object.assign([], { item: () => null });
const emptyRect = () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0 });
Range.prototype.getClientRects = Range.prototype.getClientRects ?? emptyRects;
Range.prototype.getBoundingClientRect = Range.prototype.getBoundingClientRect ?? emptyRect;

const { default: ComparePipelineYamlStep } = await import('../ComparePipelineYamlStep');

const theme = createTheme({ palette: darkPalette });

const lines = count => Array.from({ length: count }, (_, index) => `  key${index}: value${index}`);
const BASE = ['nodes:', '  - id: keep', '    type: llm', '  - id: drop', 'settings:', ...lines(20)].join(
  '\n',
);
const COMPARED = [
  'nodes:',
  '  - id: keep',
  '    type: router',
  '  - id: fresh',
  'settings:',
  ...lines(20),
].join('\n');

const renderStep = props =>
  render(
    <ThemeProvider theme={theme}>
      <ComparePipelineYamlStep
        leftVersion={{ id: 1, name: 'base' }}
        rightVersion={{ id: 2, name: 'v2' }}
        leftData={{ instructions: BASE }}
        rightData={{ instructions: COMPARED }}
        leftEdits={{}}
        rightEdits={{}}
        onLeftEdit={vi.fn()}
        onRightEdit={vi.fn()}
        onSaveLeft={vi.fn()}
        onSaveRight={vi.fn()}
        savingLeftKeys={{}}
        savingRightKeys={{}}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ComparePipelineYamlStep', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows both YAML editors with copy buttons and the change toolbar', () => {
    renderStep();
    expect(screen.getByTestId('compare-yaml-left')).toBeInTheDocument();
    expect(screen.getByTestId('compare-yaml-right')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy YAML from version base' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy YAML from version v2' })).toBeInTheDocument();
    expect(screen.getByTestId('compare-yaml-change-position')).toHaveTextContent(/^Change 1 of \d+$/);
    expect(screen.getByTestId('compare-yaml-previous-change')).toBeDisabled();
  });

  it('summarises the node changes by id', () => {
    renderStep();
    expect(screen.getByTestId('compare-yaml-chip-added')).toHaveTextContent('1 node added');
    expect(screen.getByTestId('compare-yaml-chip-removed')).toHaveTextContent('1 node removed');
    expect(screen.getByTestId('compare-yaml-chip-changed')).toHaveTextContent('1 node changed');
    fireEvent.click(screen.getByTestId('compare-yaml-chip-added'));
    expect(screen.getByTestId('compare-yaml-node-added-fresh')).toBeInTheDocument();
  });

  it('collapses a long unchanged block and offers to show it', () => {
    renderStep();
    const collapsed = document.querySelectorAll('.cm-collapsedLines');
    expect(collapsed.length).toBeGreaterThan(0);
    expect(collapsed[0].textContent).toMatch(/^Show \d+ unchanged lines$/);
    expect(collapsed[0]).toHaveAttribute('tabindex', '0');
  });

  it('says there are no differences and hides the toolbar for identical YAML', () => {
    renderStep({ rightData: { instructions: BASE } });
    expect(screen.getByTestId('compare-yaml-no-differences')).toHaveTextContent(
      'No differences in this section.',
    );
    expect(screen.queryByTestId('compare-yaml-toolbar')).not.toBeInTheDocument();
  });

  it('keeps Save disabled until that side is edited', () => {
    renderStep();
    expect(screen.getByTestId('compare-yaml-save-left')).toBeDisabled();
    expect(screen.getByTestId('compare-yaml-save-right')).toBeDisabled();
  });

  it('saves a valid edit of that side only', () => {
    const onSaveRight = vi.fn();
    renderStep({ rightEdits: { instructions: 'nodes: []\n' }, onSaveRight });
    fireEvent.click(screen.getByTestId('compare-yaml-save-right'));
    expect(onSaveRight).toHaveBeenCalledWith({ instructions: 'nodes: []\n' });
  });

  it('shows the validation message and blocks Save for invalid YAML', () => {
    renderStep({ leftEdits: { instructions: '- just\n- a list\n' } });
    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByTestId('compare-yaml-error-left')).toHaveTextContent(
      'YAML is not valid: the pipeline must be a mapping of keys and values.',
    );
    expect(screen.getByTestId('compare-yaml-save-left')).toBeDisabled();
  });

  it('blocks saving the open version while the editor has unsaved changes', () => {
    renderStep({
      leftEdits: { instructions: 'nodes: []\n' },
      rightEdits: { instructions: 'nodes: []\n' },
      leftSaveDisabledReason: 'Save or discard your changes in the editor first.',
    });
    expect(screen.getByTestId('compare-yaml-save-left')).toBeDisabled();
    expect(screen.getByTestId('compare-yaml-save-right')).toBeEnabled();
  });

  it('reads "Saving..." while a save runs', () => {
    renderStep({ leftEdits: { instructions: 'nodes: []\n' }, savingLeftKeys: { instructions: true } });
    expect(screen.getByTestId('compare-yaml-save-left')).toHaveTextContent('Saving...');
  });

  it('falls back to plain editors for a YAML over 10,000 lines', () => {
    const huge = ['nodes: []', ...lines(10001)].join('\n');
    renderStep({ leftData: { instructions: huge } });
    expect(screen.getByTestId('compare-yaml-too-large')).toHaveTextContent(
      'This YAML is too large to compare side by side. Showing the text without highlights.',
    );
    expect(screen.getByTestId('compare-yaml-plain-editors')).toBeInTheDocument();
    expect(screen.queryByTestId('compare-yaml-toolbar')).not.toBeInTheDocument();
  });

  it('keeps the indent when Enter is pressed in the YAML editor', () => {
    renderStep({ leftData: { instructions: 'nodes:\n  - id: a\n    type: llm' } });
    const editor = document.querySelector('.cm-merge-a .cm-content');
    const view = EditorView.findFromDOM(editor.closest('.cm-editor'));
    view.dispatch({ selection: { anchor: view.state.doc.length } });

    runScopeHandlers(
      view,
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13 }),
      'editor',
    );

    const textLines = view.state.doc.toString().split('\n');
    expect(textLines).toHaveLength(4);
    expect(textLines.at(-1)).toBe('    ');
  });

  it('does not rewrite or recount a YAML stored with CRLF line endings', () => {
    const base = 'nodes:\r\n  - id: keep\r\n    type: llm\r\n';
    const compared = 'nodes:\r\n  - id: keep\r\n    type: router\r\n';
    const onLeftEdit = vi.fn();
    const onRightEdit = vi.fn();
    renderStep({
      leftData: { instructions: base },
      rightData: { instructions: compared },
      onLeftEdit,
      onRightEdit,
    });
    act(() => vi.advanceTimersByTime(600));

    // Nothing was typed, so nothing counts as an edit
    expect(onLeftEdit).not.toHaveBeenCalled();
    expect(onRightEdit).not.toHaveBeenCalled();
    expect(screen.getByTestId('compare-yaml-save-left')).toBeDisabled();
    // The editor shows the text with plain line breaks
    const view = EditorView.findFromDOM(document.querySelector('.cm-editor.cm-merge-a'));
    expect(view.state.doc.toString()).toBe('nodes:\n  - id: keep\n    type: llm\n');
  });

  it('opens the collapsed block that hides the id line of a changed node when its id is picked', () => {
    // The id: line of "far" is 12 unchanged lines above its change, so it sits in a collapsed block
    // Unique keys per line, or the YAML would have duplicate keys and no node summary
    const filler = (prefix, count) =>
      Array.from({ length: count }, (_, index) => `    ${prefix}${index}: value`);
    const text = (first, last) =>
      [
        'nodes:',
        '  - id: first',
        `    prompt: ${first}`,
        ...filler('top', 30),
        '  - id: far',
        ...filler('mid', 12),
        `    prompt: ${last}`,
        ...filler('end', 5),
      ].join('\n');
    renderStep({ leftData: { instructions: text('a', 'x') }, rightData: { instructions: text('b', 'y') } });

    const hasIdLine = side =>
      [...document.querySelectorAll(`.cm-merge-${side} .cm-line`)].some(
        line => line.textContent === '  - id: far',
      );
    expect(hasIdLine('a')).toBe(false);
    expect(hasIdLine('b')).toBe(false);

    fireEvent.click(screen.getByTestId('compare-yaml-chip-changed'));
    fireEvent.click(screen.getByTestId('compare-yaml-node-changed-far'));

    // Both sides open the block, so the line is on screen and the editors stay in line
    expect(hasIdLine('a')).toBe(true);
    expect(hasIdLine('b')).toBe(true);
  });
});
