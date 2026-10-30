// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CreateSkillForm from '../CreateSkillForm';

vi.mock('@/[fsd]/features/entity-icon-editor', () => ({ EditableEntityIcon: () => null }));
vi.mock('@/[fsd]/features/skill/lib/constants', () => ({
  SKILL_NAME_MAX_LENGTH: 64,
  SPEC_MAX_DESCRIPTION_LENGTH: 1024,
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useSkillFrontmatterEditor: () => ({
    editorText: '',
    onEditorChange: () => {},
    frontmatterErrors: [
      '"metadata.elitea-model" names an unknown model: gpt-9',
      '"metadata.elitea-temperature" must be a number',
    ],
  }),
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

describe('CreateSkillForm frontmatter errors', () => {
  afterEach(() => cleanup());

  it('shows each frontmatter error on its own line', () => {
    render(
      <ThemeProvider theme={theme}>
        <Formik
          initialValues={{ name: 'skill', description: '', version_details: { instructions: 'Do it.' } }}
          onSubmit={() => {}}
        >
          <CreateSkillForm isCreateMode />
        </Formik>
      </ThemeProvider>,
    );

    const lines = Array.from(screen.getByTestId('skill-frontmatter-error').children).map(
      line => line.textContent,
    );
    expect(lines).toEqual([
      '"metadata.elitea-model" names an unknown model: gpt-9',
      '"metadata.elitea-temperature" must be a number',
    ]);
  });
});
