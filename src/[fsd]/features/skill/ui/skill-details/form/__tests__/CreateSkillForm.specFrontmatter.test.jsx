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
  Input: {
    StyledInputEnhancer: ({ helperText, 'data-testid': testId }) => (
      <div data-testid={testId}>{helperText}</div>
    ),
  },
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

const renderForm = ({ description = 'Sorts issues', meta = {} } = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={{ name: 'skill', description, version_details: { instructions: 'Do it.', meta } }}
        onSubmit={() => {}}
      >
        <CreateSkillForm />
      </Formik>
    </ThemeProvider>,
  );

describe('CreateSkillForm Agent Skills spec fields', () => {
  afterEach(() => cleanup());

  it('shows the licence kept from the frontmatter', () => {
    renderForm({ meta: { frontmatter: { license: 'Proprietary. LICENSE.txt has complete terms' } } });

    expect(screen.getByTestId('skill-license')).toHaveTextContent(
      'License: Proprietary. LICENSE.txt has complete terms',
    );
  });

  it('shows no licence line when the skill has none', () => {
    renderForm({ meta: { frontmatter: { 'allowed-tools': 'Read' } } });

    expect(screen.queryByTestId('skill-license')).not.toBeInTheDocument();
  });

  it('warns when the description is longer than the spec allows', () => {
    renderForm({ description: 'd'.repeat(1025) });

    expect(screen.getByTestId('skill-description-input')).toHaveTextContent(
      'Longer than 1024 characters: Claude and other Agent Skills tools will reject the exported skill.',
    );
  });

  it('shows no warning at the spec limit', () => {
    renderForm({ description: 'd'.repeat(1024) });

    expect(screen.getByTestId('skill-description-input')).toBeEmptyDOMElement();
  });
});
