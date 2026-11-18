// @vitest-environment jsdom
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const editor = vi.hoisted(() => ({ renders: [] }));

vi.mock('@/[fsd]/features/skill/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSkillFileActions: () => ({ isBusy: false }),
  useSkillInstructionsMaxLength: () => 1000,
  useSkillModels: () => ({ models: [] }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useIsSmallWindow: () => ({ isSmallWindow: false }),
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
vi.mock('../SkillFileViewer', () => ({ default: () => null }));

const { eliteaApi } = await import('@/api/eliteaApi.js');
const { default: SkillSplitEditor } = await import('../SkillSplitEditor');

const store = configureStore({
  reducer: {
    user: () => ({ id: 1 }),
    settings: () => ({ project: null }),
    [eliteaApi.reducerPath]: eliteaApi.reducer,
  },
  middleware: getDefault => getDefault({ serializableCheck: false }).concat(eliteaApi.middleware),
});

const renderPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/skills/7?view=files&panel=instructions']}>
        <ThemeProvider theme={createTheme({ palette: darkPalette })}>
          <Formik
            initialValues={{
              name: 'pdf',
              description: 'Reads PDFs',
              version_details: { instructions: 'Read FORMS.md.', meta: {}, tags: [] },
            }}
            onSubmit={vi.fn()}
          >
            <SkillSplitEditor
              files={[{ path: 'FORMS.md', size: 1, isText: true }]}
              scope={{ projectId: 2, skillId: 7, versionId: 70 }}
              settings={null}
              isTestPanelOpen={false}
            />
          </Formik>
        </ThemeProvider>
      </MemoryRouter>
    </Provider>,
  );

describe('SkillSplitEditor instructions', () => {
  afterEach(() => {
    cleanup();
    editor.renders.length = 0;
  });

  it('keeps text the form cannot hold when the instructions column closes and opens again', () => {
    renderPage();
    const unclosedFrontmatter = '---\nname: pdf';
    act(() => editor.renders.at(-1).notifyChange(unclosedFrontmatter));
    expect(editor.renders.at(-1).value).toBe(unclosedFrontmatter);

    fireEvent.click(screen.getByTestId('skill-instructions-close'));
    expect(screen.queryByTestId('skill-instructions-editor')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('skill-open-instructions'));

    expect(editor.renders.at(-1).value).toBe(unclosedFrontmatter);
  });
});
