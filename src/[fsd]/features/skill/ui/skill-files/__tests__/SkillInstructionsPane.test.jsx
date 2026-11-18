// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

const editor = vi.hoisted(() => ({ renders: [] }));

vi.mock('@/[fsd]/features/skill/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSkillInstructionsMaxLength: () => 1000,
  useSkillModels: () => ({ models: [] }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastInfo: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn() }),
}));
vi.mock('@/[fsd]/shared/ui', async importOriginal => ({
  ...(await importOriginal()),
  Field: {
    CodeMirrorEditor: props => {
      editor.renders.push(props);
      return null;
    },
  },
}));

const { default: SkillInstructionsPane } = await import('../SkillInstructionsPane');

const theme = createTheme({ palette: darkPalette });

const paneTree = (length, paneProps = {}) => (
  <ThemeProvider theme={theme}>
    <Formik
      initialValues={{ version_details: { instructions: 'i'.repeat(length) } }}
      onSubmit={vi.fn()}
    >
      <SkillInstructionsPane {...paneProps} />
    </Formik>
  </ThemeProvider>
);

const renderPane = (length, paneProps) => render(paneTree(length, paneProps));

describe('SkillInstructionsPane counter', () => {
  afterEach(() => {
    cleanup();
    editor.renders.length = 0;
  });

  it('stays muted below 90% of the limit', () => {
    renderPane(899);
    expect(screen.getByTestId('skill-instructions-counter')).toHaveStyle({ color: darkPalette.text.muted });
  });

  it('turns to the warning colour from 90% of the limit', () => {
    renderPane(900);
    expect(screen.getByTestId('skill-instructions-counter')).toHaveTextContent('100 characters left');
    expect(screen.getByTestId('skill-instructions-counter')).toHaveStyle({
      color: darkPalette.warning.main,
    });
  });

  it('keeps the same editor extensions while typing beside an open file', () => {
    const files = [{ path: 'FORMS.md' }];
    const onEditorChange = vi.fn();
    const { rerender } = renderPane(10, { files, openPath: 'FORMS.md', editorText: 'Read', onEditorChange });
    const first = editor.renders.at(-1);

    rerender(
      paneTree(10, { files, openPath: 'FORMS.md', editorText: 'Read FORMS.md first.', onEditorChange }),
    );

    const last = editor.renders.at(-1);
    expect(last.value).toBe('Read FORMS.md first.');
    expect(last.extensions).toBe(first.extensions);
  });
});
