// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';

import NodeAiReviewStep from '../NodeAiReviewStep';

vi.mock('@/[fsd]/features/pipelines/yaml-editor/ui', () => ({
  YamlCodeEditor: props => (
    <textarea
      data-testid={props['data-testid']}
      value={props.code}
      onChange={event => props.onChangeCode(event.target.value)}
    />
  ),
}));

// The sandbox is covered on its own; here it only shows which node it got
vi.mock('../NodeDraftSandbox', () => ({
  default: props => (
    <button
      data-testid="sandbox-stub"
      data-node={JSON.stringify(props.node)}
      onClick={() => props.onChange({ ...props.node, transition: 'edited' })}
    />
  ),
}));

const theme = createTheme({ palette: darkPalette });

const DRAFT = {
  summary: 'Summarizes new issues into a table.',
  node: { id: 'summarize', type: 'llm', transition: 'END' },
  changedPaths: ['transition'],
  attachments: [],
  newState: [],
  warnings: [],
};

const renderStep = (props = {}) => {
  const handlers = {
    updateDraftNode: vi.fn(),
    toggleNewState: vi.fn(),
    back: vi.fn(),
    regenerate: vi.fn(),
    apply: vi.fn(),
  };
  render(
    <ThemeProvider theme={theme}>
      <NodeAiReviewStep
        draft={DRAFT}
        isDraftEdited={false}
        pipeline={{ nodes: [DRAFT.node] }}
        NodeComponent={() => null}
        {...handlers}
        {...props}
      />
    </ThemeProvider>,
  );
  return handlers;
};

describe('NodeAiReviewStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });
  afterEach(() => cleanup());

  it('shows the summary and opens on Flow view (AC-11)', () => {
    renderStep();
    expect(screen.getByTestId('node-ai-summary')).toHaveTextContent('Summarizes new issues into a table.');
    expect(screen.getByTestId('node-ai-view-flow-tab')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('sandbox-stub')).toBeInTheDocument();
  });

  it('hides empty blocks', () => {
    renderStep();
    expect(screen.queryByTestId('node-ai-attachments-list')).toBeNull();
    expect(screen.queryByTestId('node-ai-new-state-list')).toBeNull();
    expect(screen.queryByTestId('node-ai-warnings-list')).toBeNull();
  });

  it('lists attachments, new state and warnings (AC-19…AC-21)', () => {
    const { toggleNewState } = renderStep({
      draft: {
        ...DRAFT,
        attachments: [
          { entity_type: 'toolkit', id: 2, name: 'jira_platform', needs_login: false },
          { entity_type: 'mcp', id: 3, name: 'docs_mcp', needs_login: true },
        ],
        newState: [{ name: 'summary', type: 'str', checked: true }],
        warnings: ['Tool parameter `project_key` needs a value.'],
      },
    });
    expect(screen.getByTestId('node-ai-attachments-list')).toHaveTextContent(
      'jira_platform · Will be attached',
    );
    expect(screen.getByTestId('node-ai-attachments-list')).toHaveTextContent('Log in required');
    expect(screen.getByTestId('node-ai-new-state-list')).toHaveTextContent('summary (str)');
    fireEvent.click(screen.getByTestId('node-ai-new-state-checkbox'));
    expect(toggleNewState).toHaveBeenCalledWith('summary');
    expect(screen.getByTestId('node-ai-warnings-list')).toHaveTextContent(
      'Tool parameter `project_key` needs a value.',
    );
    expect(screen.getByTestId('node-ai-apply-button')).toBeEnabled();
  });

  it('passes Flow view edits on', () => {
    const { updateDraftNode } = renderStep();
    fireEvent.click(screen.getByTestId('sandbox-stub'));
    expect(updateDraftNode).toHaveBeenCalledWith({ ...DRAFT.node, transition: 'edited' });
  });

  it('shows the draft in YAML view and applies edits after 400 ms (AC-14)', () => {
    vi.useFakeTimers();
    const { updateDraftNode } = renderStep();
    fireEvent.click(screen.getByTestId('node-ai-view-yaml-tab'));
    const editor = screen.getByTestId('node-ai-yaml-editor');
    expect(editor.value).toContain('transition: END');

    fireEvent.change(editor, { target: { value: '- id: summarize\n  type: llm\n  transition: next\n' } });
    act(() => vi.advanceTimersByTime(399));
    expect(updateDraftNode).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(updateDraftNode).toHaveBeenCalledWith({ id: 'summarize', type: 'llm', transition: 'next' });
  });

  it('shows the rename error and keeps the draft (AC-15)', () => {
    vi.useFakeTimers();
    const { updateDraftNode } = renderStep();
    fireEvent.click(screen.getByTestId('node-ai-view-yaml-tab'));
    fireEvent.change(screen.getByTestId('node-ai-yaml-editor'), {
      target: { value: '- id: other\n  type: llm\n' },
    });
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByTestId('node-ai-yaml-error')).toHaveTextContent(
      'Rename the node in the Name field after applying.',
    );
    expect(updateDraftNode).not.toHaveBeenCalled();
  });

  it('asks to fix invalid YAML before Flow view or Apply, and can discard it (AC-16)', async () => {
    const { apply } = renderStep();
    fireEvent.click(screen.getByTestId('node-ai-view-yaml-tab'));
    fireEvent.change(screen.getByTestId('node-ai-yaml-editor'), {
      target: { value: '- id: summarize\n  type: [' },
    });

    fireEvent.click(screen.getByTestId('node-ai-apply-button'));
    expect(screen.getByText('Fix the YAML first')).toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('node-ai-yaml-fix-button'));
    // the dialog leaves the DOM after its close transition
    await waitForElementToBeRemoved(() => screen.queryByText('Fix the YAML first'));

    fireEvent.click(screen.getByTestId('node-ai-view-flow-tab'));
    fireEvent.click(screen.getByTestId('node-ai-yaml-discard-button'));
    expect(screen.getByTestId('node-ai-view-flow-tab')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByTestId('node-ai-view-yaml-tab'));
    expect(screen.getByTestId('node-ai-yaml-editor').value).toContain('transition: END');
  });

  it('regenerates at once when the draft is untouched, and confirms when it was edited (AC-17)', () => {
    const { regenerate } = renderStep();
    fireEvent.click(screen.getByTestId('node-ai-regenerate-button'));
    expect(regenerate).toHaveBeenCalledTimes(1);
    cleanup();

    const edited = renderStep({ isDraftEdited: true });
    fireEvent.click(screen.getByTestId('node-ai-regenerate-button'));
    expect(screen.getByText('Replace your edits with a new draft?')).toBeInTheDocument();
    expect(edited.regenerate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Keep editing'));
    expect(edited.regenerate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('node-ai-regenerate-button'));
    fireEvent.click(screen.getByText('Replace'));
    expect(edited.regenerate).toHaveBeenCalledTimes(1);
  });

  describe('Edit mode markers (AC-13)', () => {
    const ORIGINAL = { id: 'summarize', type: 'llm', transition: 'END' };
    const EDITED = { ...DRAFT, node: { ...ORIGINAL, transition: 'next' }, changedPaths: ['transition'] };

    it('counts and marks the changed fields', () => {
      renderStep({ draft: EDITED, original: ORIGINAL, mode: 'edit' });
      expect(screen.getByTestId('node-ai-changed-count')).toHaveTextContent('1 field changed');
      expect(screen.getByTestId('node-ai-changed-marker')).toHaveTextContent('Changed · transition');
    });

    it('recounts after the user edits the draft', () => {
      renderStep({
        draft: { ...EDITED, node: { ...EDITED.node, output: ['x'] } },
        original: ORIGINAL,
        mode: 'edit',
      });
      expect(screen.getByTestId('node-ai-changed-count')).toHaveTextContent('2 fields changed');
      expect(screen.getAllByTestId('node-ai-changed-marker').map(item => item.textContent)).toEqual([
        'Changed · output',
        'Changed · transition',
      ]);
    });

    it('shows the YAML diff against the original next to the editor', () => {
      renderStep({ draft: EDITED, original: ORIGINAL, mode: 'edit' });
      fireEvent.click(screen.getByTestId('node-ai-view-yaml-tab'));
      const lines = screen.getByTestId('node-ai-yaml-diff').querySelectorAll('[data-kind]');
      const kinds = Array.from(lines).map(line => [line.dataset.kind, line.textContent.trim()]);
      expect(kinds).toEqual([
        ['same', '- id: summarize'],
        ['same', 'type: llm'],
        ['removed', '−  transition: END'],
        ['added', '+  transition: next'],
      ]);
    });

    it('has no markers in Build mode', () => {
      renderStep({ draft: EDITED, original: ORIGINAL, mode: 'build' });
      expect(screen.queryByTestId('node-ai-changed-count')).toBeNull();
      expect(screen.queryByTestId('node-ai-changed-marker')).toBeNull();
      fireEvent.click(screen.getByTestId('node-ai-view-yaml-tab'));
      expect(screen.queryByTestId('node-ai-yaml-diff')).toBeNull();
    });
  });

  it('applies the YAML typed just before Apply, without waiting for the debounce (review #1)', () => {
    vi.useFakeTimers();
    const { apply, updateDraftNode } = renderStep();
    fireEvent.click(screen.getByTestId('node-ai-view-yaml-tab'));
    fireEvent.change(screen.getByTestId('node-ai-yaml-editor'), {
      target: { value: '- id: summarize\n  type: llm\n  transition: typed\n' },
    });
    fireEvent.click(screen.getByTestId('node-ai-apply-button'));
    expect(apply).toHaveBeenCalledWith({ id: 'summarize', type: 'llm', transition: 'typed' });
    expect(updateDraftNode).toHaveBeenCalledWith({ id: 'summarize', type: 'llm', transition: 'typed' });
  });

  it('keeps the YAML text as typed when its own edit comes back as the draft (review #4)', () => {
    vi.useFakeTimers();
    let latest = DRAFT;
    const updateDraftNode = vi.fn(node => {
      latest = { ...latest, node };
    });
    const props = {
      isDraftEdited: false,
      pipeline: { nodes: [DRAFT.node] },
      NodeComponent: () => null,
      toggleNewState: vi.fn(),
      back: vi.fn(),
      regenerate: vi.fn(),
      apply: vi.fn(),
      updateDraftNode,
    };
    const view = render(
      <ThemeProvider theme={theme}>
        <NodeAiReviewStep
          {...props}
          draft={latest}
        />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByTestId('node-ai-view-yaml-tab'));
    const typed = '- id: summarize\n  type: llm\n  transition: "typed"   # mine\n';
    fireEvent.change(screen.getByTestId('node-ai-yaml-editor'), { target: { value: typed } });
    act(() => vi.advanceTimersByTime(400));
    // the parent passes the applied node back down, as useNodeAiDraft does
    view.rerender(
      <ThemeProvider theme={theme}>
        <NodeAiReviewStep
          {...props}
          draft={latest}
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('node-ai-yaml-editor').value).toBe(typed);
  });

  it('goes back and applies', () => {
    const { back, apply } = renderStep();
    fireEvent.click(screen.getByTestId('node-ai-back-button'));
    expect(back).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('node-ai-apply-button'));
    expect(apply).toHaveBeenCalled();
  });
});
