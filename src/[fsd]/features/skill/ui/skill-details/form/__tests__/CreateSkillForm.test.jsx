// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import CreateSkillForm from '../CreateSkillForm';

vi.mock('@/[fsd]/features/entity-icon-editor', () => ({ EditableEntityIcon: () => null }));
vi.mock('@/[fsd]/features/skill/lib/constants', () => ({ SKILL_NAME_MAX_LENGTH: 64 }));
vi.mock('@/[fsd]/features/skill/lib/hooks', async () => ({
  ...(await vi.importActual('@/[fsd]/features/skill/lib/hooks/useSkillFrontmatterEditor.hooks')),
  useSkillInstructionsMaxLength: () => 50000,
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
