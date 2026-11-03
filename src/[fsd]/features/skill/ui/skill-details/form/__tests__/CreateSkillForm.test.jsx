// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import CreateSkillForm from '../CreateSkillForm';

vi.mock('@/[fsd]/features/entity-icon-editor', () => ({ EditableEntityIcon: () => null }));
vi.mock('@/[fsd]/features/skill/lib/constants', () => ({
  SKILL_NAME_MAX_LENGTH: 64,
  SPEC_MAX_DESCRIPTION_LENGTH: 1024,
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', async () => ({
  ...(await vi.importActual('@/[fsd]/features/skill/lib/hooks/useSkillFrontmatterEditor.hooks')),
  useSkillInstructionsMaxLength: () => 50000,
  useSkillModels: () => ({ models: [] }),
}));
vi.mock('@/[fsd]/features/skill/ui/generate-skill-modal', () => ({ GenerateSkillButton: () => null }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useFieldFocus: () => ({ toggleFieldFocus: vi.fn(), isFocused: () => false }),
  useSelectedProjectId: () => 1,
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Field: { CodeMirrorEditor: () => <div data-testid="codemirror-editor" /> },
  Input: { StyledInputEnhancer: () => null },
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
  Text: { CharacterCounter: () => null },
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
vi.mock('@/[fsd]/shared/config/store', () => ({ default: {} }));
vi.mock('@/api/tags.js', () => ({ useTagListQuery: () => ({ data: {} }) }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => false }) }));
vi.mock('@/components/StyledInputModal', () => ({
  default: ({ value, onChange, onClose, inputProps, countLength }) => (
    <button
      data-testid="full-screen-modal-close"
      data-max-length={inputProps?.maxLength}
      data-counts-body={String(typeof countLength === 'function')}
      onClick={() => {
        onChange({ target: { value: value.replace('## Ping', '## Pong') } });
        onClose();
      }}
    />
  ),
}));
vi.mock('@/pages/Common/Components/TagEditor', () => ({ default: () => null }));
vi.mock('../SkillRunSettings', () => ({ default: () => null }));

const theme = createTheme({ palette: lightPalette });

const renderForm = props =>
  render(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={{ name: 'Skill', description: '', version_details: { instructions: '## Ping' } }}
        onSubmit={() => {}}
      >
        <CreateSkillForm {...props} />
      </Formik>
    </ThemeProvider>,
  );

describe('CreateSkillForm instructions view mode', () => {
  afterEach(() => cleanup());

  it('opens an existing skill in Preview mode', () => {
    renderForm();

    expect(screen.getByTestId('instructions-markdown')).toHaveTextContent('## Ping');
    expect(screen.queryByTestId('skill-instructions-editor')).not.toBeInTheDocument();
    expect(screen.getByTestId('markdown-preview-mode-toggle')).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens a new skill in Edit mode', () => {
    renderForm({ isCreateMode: true });

    expect(screen.getByTestId('skill-instructions-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('instructions-markdown')).not.toBeInTheDocument();
    expect(screen.getByTestId('editor-actions')).toBeInTheDocument();
  });

  it('shows Copy and Full Screen actions only in Edit mode', () => {
    renderForm();

    expect(screen.queryByTestId('editor-actions')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));

    expect(screen.getByTestId('editor-actions')).toBeInTheDocument();
  });

  it('copies the full editor source including frontmatter', () => {
    renderForm();

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));

    const copiedValue = screen.getByTestId('editor-actions').getAttribute('data-value');
    expect(copiedValue).toMatch(/^---\n/);
    expect(copiedValue).toContain('name: Skill');
    expect(copiedValue).toContain('## Ping');
  });

  it('keeps full-screen edits after exiting full screen', () => {
    renderForm();

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));
    fireEvent.click(screen.getByTestId('editor-full-screen'));
    fireEvent.click(screen.getByTestId('full-screen-modal-close'));

    expect(screen.queryByTestId('full-screen-modal-close')).not.toBeInTheDocument();
    expect(screen.getByTestId('editor-actions').getAttribute('data-value')).toContain('## Pong');

    fireEvent.click(screen.getByTestId('markdown-preview-mode-toggle'));

    expect(screen.getByTestId('instructions-markdown')).toHaveTextContent('## Pong');
    expect(screen.getByTestId('instructions-markdown')).not.toHaveTextContent('name: Skill');
  });

  it('applies the instructions limit in full screen', () => {
    renderForm();

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));
    fireEvent.click(screen.getByTestId('editor-full-screen'));

    const modal = screen.getByTestId('full-screen-modal-close');
    expect(Number(modal.getAttribute('data-max-length'))).toBeGreaterThan(0);
    expect(modal.getAttribute('data-counts-body')).toBe('true');
  });

  it('places the Preview toggle before the Edit toggle', () => {
    renderForm();

    const labels = screen
      .getAllByRole('button', { name: /^(Preview|Edit) mode$/ })
      .map(button => button.getAttribute('aria-label'));
    expect(labels).toEqual(['Preview mode', 'Edit mode']);
  });

  it('switches from Preview to Edit and back', () => {
    renderForm();

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));
    expect(screen.getByTestId('skill-instructions-editor')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('markdown-preview-mode-toggle'));
    expect(screen.getByTestId('instructions-markdown')).toBeInTheDocument();
  });
});
