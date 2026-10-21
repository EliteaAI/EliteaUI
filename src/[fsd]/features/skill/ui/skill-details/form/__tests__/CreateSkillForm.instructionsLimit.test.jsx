// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import { cleanup, render, screen } from '@testing-library/react';

import CreateSkillForm from '../CreateSkillForm';

const captured = vi.hoisted(() => ({ editorMaxLength: undefined }));

vi.mock('@/[fsd]/features/skill/lib/hooks', async () => ({
  ...(await vi.importActual('@/[fsd]/features/skill/lib/hooks/useSkillFrontmatterEditor.hooks')),
  useSkillInstructionsMaxLength: () => 1200,
}));
vi.mock('@/[fsd]/features/entity-icon-editor', () => ({ EditableEntityIcon: () => null }));
vi.mock('@/[fsd]/features/skill/ui/generate-skill-modal', () => ({ GenerateSkillButton: () => null }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useFieldFocus: () => ({ toggleFieldFocus: vi.fn(), isFocused: () => false }),
  useSelectedProjectId: () => 2,
}));
vi.mock('@/api/tags.js', () => ({ useTagListQuery: () => ({ data: {} }) }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/pages/Common/Components/TagEditor', () => ({ default: () => null }));
vi.mock('../SkillRunSettings', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui', () => ({
  Field: {
    CodeMirrorEditor: ({ maxLength }) => {
      captured.editorMaxLength = maxLength;
      return null;
    },
  },
  Input: { StyledInputEnhancer: () => null },
  Markdown: () => null,
  Text: { CharacterCounter: () => null },
}));
vi.mock('@/[fsd]/shared/ui/accordion/BasicAccordion', () => ({
  default: ({ items }) => items.map(item => <div key={item.title}>{item.content}</div>),
}));
vi.mock('@/[fsd]/shared/ui/tab-group-button', () => ({ MarkdownViewToggle: () => null }));

const renderForm = instructions =>
  render(
    <ThemeProvider theme={createTheme({ palette: darkPalette })}>
      <Formik
        initialValues={{ name: 'reviewer', description: 'Reviews code', version_details: { instructions } }}
        onSubmit={vi.fn()}
      >
        <CreateSkillForm isCreateMode />
      </Formik>
    </ThemeProvider>,
  );

describe('CreateSkillForm instructions limit', () => {
  afterEach(() => {
    cleanup();
    captured.editorMaxLength = undefined;
  });

  it('counts the characters left against the configured limit, not 5000', () => {
    renderForm('i'.repeat(200));

    expect(screen.getByText('1000 characters left')).toBeTruthy();
  });

  it('says how far over the limit a skill saved before the limit was lowered is', () => {
    renderForm('i'.repeat(1500));

    expect(screen.getByText('300 characters over the limit')).toBeTruthy();
  });

  it('caps the editor at the configured limit', () => {
    renderForm('');

    expect(captured.editorMaxLength).toBe(1200);
  });
});
