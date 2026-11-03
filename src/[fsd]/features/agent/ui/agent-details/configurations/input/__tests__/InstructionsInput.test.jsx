// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import InstructionsInput from '../InstructionsInput';

const mentionHook = () => ({
  phase: 'idle',
  selectedItem: null,
  committedMentions: [],
  filteredItems: [],
  filteredTools: [],
  highlightedIndex: 0,
  codeMirrorExtensions: [],
  onKeyDown: vi.fn(),
  onInstructionsInputChange: vi.fn(),
  onSelectItem: vi.fn(),
  onSelectTool: vi.fn(),
  resetSlash: vi.fn(),
});

vi.mock('@/[fsd]/features/agent/lib/hooks/useInstructionsMention.hooks', () => ({
  useInstructionsMention: () => mentionHook(),
}));
vi.mock('@/[fsd]/features/agent/lib/hooks/useInstructionsSkillMention.hooks', () => ({
  useInstructionsSkillMention: () => mentionHook(),
}));
vi.mock('@/[fsd]/features/skill', () => ({ MentionSkillList: () => null }));
vi.mock('@/[fsd]/shared/lib/context', () => ({ useInstructionsInputRefContext: () => ({ current: null }) }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 1 }));
vi.mock('@/[fsd]/shared/ui', () => ({
  Markdown: ({ children }) => <div data-testid="instructions-markdown">{children}</div>,
  MarkdownEditorActions: ({ value, onFullScreen }) => (
    <div
      data-testid="editor-actions"
      data-value={value}
    >
      <button
        data-testid="editor-full-screen"
        onClick={onFullScreen}
      />
    </div>
  ),
}));
vi.mock('@/[fsd]/shared/ui/accordion/BasicAccordion', () => ({
  default: ({ items }) =>
    items.map(item => (
      <div key={item.title}>
        {item.summaryAction}
        {item.content}
      </div>
    )),
}));
vi.mock('../InstructionsSlashSuggestionList', () => ({ default: () => null }));
vi.mock('../InstructionsMarkdownEditor', () => ({
  default: ({ value, onValueChange, isFullScreenOpen }) => (
    <div
      data-testid="instructions-editor"
      data-value={value}
      data-full-screen={String(isFullScreenOpen)}
    >
      <button
        data-testid="instructions-editor-type"
        onClick={() => onValueChange('# Updated')}
      />
    </div>
  ),
}));

const theme = createTheme({ palette: lightPalette });

const renderInput = (instructions = '## Ping', props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={{ version_details: { id: 1, instructions, variables: [] } }}
        onSubmit={() => {}}
      >
        <InstructionsInput {...props} />
      </Formik>
    </ThemeProvider>,
  );

describe('InstructionsInput view mode', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('opens in Preview mode with rendered Markdown and no editor actions', () => {
    renderInput();

    expect(screen.getByTestId('instructions-markdown')).toHaveTextContent('## Ping');
    expect(screen.queryByTestId('instructions-editor')).not.toBeInTheDocument();
    expect(screen.queryByTestId('editor-actions')).not.toBeInTheDocument();
    expect(screen.getByTestId('markdown-preview-mode-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens in Edit mode when creating an agent', () => {
    renderInput('', { isCreateMode: true });

    expect(screen.getByTestId('instructions-editor')).toBeInTheDocument();
    expect(screen.getByTestId('editor-actions')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-edit-mode-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows an empty state in Preview when there are no instructions', () => {
    renderInput('');

    expect(screen.getByText('No instructions yet.')).toBeInTheDocument();
  });

  it('places the Preview toggle before the Edit toggle', () => {
    renderInput();

    const labels = screen
      .getAllByRole('button', { name: /^(Preview|Edit) mode$/ })
      .map(button => button.getAttribute('aria-label'));
    expect(labels).toEqual(['Preview mode', 'Edit mode']);
  });

  it('shows the editor with Copy and Full Screen actions in Edit mode and no Collapse control', () => {
    renderInput();

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));

    expect(screen.getByTestId('instructions-editor')).toHaveAttribute('data-value', '## Ping');
    expect(screen.getByTestId('editor-actions')).toBeInTheDocument();
    expect(screen.queryByLabelText(/collapse field/i)).not.toBeInTheDocument();
  });

  it('keeps unsaved edits when switching between Edit and Preview', () => {
    renderInput();

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));
    fireEvent.click(screen.getByTestId('instructions-editor-type'));
    fireEvent.click(screen.getByTestId('markdown-preview-mode-toggle'));

    expect(screen.getByTestId('instructions-markdown')).toHaveTextContent('# Updated');

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));

    expect(screen.getByTestId('instructions-editor')).toHaveAttribute('data-value', '# Updated');
  });

  it('copies the current draft', () => {
    renderInput();

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));
    fireEvent.click(screen.getByTestId('instructions-editor-type'));

    expect(screen.getByTestId('editor-actions')).toHaveAttribute('data-value', '# Updated');
  });

  it('opens the editor in full screen from the Full Screen action', () => {
    renderInput();

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));
    fireEvent.click(screen.getByTestId('editor-full-screen'));

    expect(screen.getByTestId('instructions-editor')).toHaveAttribute('data-full-screen', 'true');
  });
});
