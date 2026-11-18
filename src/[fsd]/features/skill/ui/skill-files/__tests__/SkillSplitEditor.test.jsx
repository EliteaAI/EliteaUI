// @vitest-environment jsdom
import { useEffect } from 'react';

import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

const { actions, smallWindow } = vi.hoisted(() => ({
  actions: {
    isBusy: false,
    uploadFiles: vi.fn(),
    renamePath: vi.fn(() => Promise.resolve()),
    deletePath: vi.fn(() => Promise.resolve()),
    downloadPath: vi.fn(),
    copyPath: vi.fn(),
  },
  smallWindow: { current: false },
}));

vi.mock('@/[fsd]/features/skill/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSkillFileActions: () => actions,
  useSkillFrontmatterEditor: () => ({ editorText: '', onEditorChange: () => {}, frontmatterErrors: [] }),
  useSkillModels: () => ({ models: [] }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useIsSmallWindow: () => ({ isSmallWindow: smallWindow.current }),
  useToast: () => ({ toastInfo: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn() }),
}));
vi.mock('../SkillInstructionsPane', () => ({
  default: props => (
    <div
      data-testid="instructions-pane"
      data-open-path={props.openPath ?? ''}
      data-read-only-files={String(Boolean(props.readOnlyFiles))}
    />
  ),
}));
vi.mock('../SkillFileViewer', () => ({
  default: props => (
    <div
      data-testid="file-viewer"
      data-path={props.file.path}
    />
  ),
}));

const { eliteaApi } = await import('@/api/eliteaApi.js');
const { default: SkillSplitEditor } = await import('../SkillSplitEditor');

const FILES = [
  { path: 'scripts/fill.py', size: 10, isText: true },
  { path: 'scripts/lib/pdf.py', size: 10, isText: true },
  { path: 'references/FORMS.md', size: 10, isText: true },
];
const SCOPE = { projectId: 2, skillId: 7, versionId: 70 };
const theme = createTheme({ palette: darkPalette });
const store = configureStore({
  reducer: {
    user: () => ({ id: 1 }),
    settings: () => ({ project: null }),
    [eliteaApi.reducerPath]: eliteaApi.reducer,
  },
  middleware: getDefault => getDefault({ serializableCheck: false }).concat(eliteaApi.middleware),
});

const editorTree = (url, props) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[url]}>
      <ThemeProvider theme={theme}>
        <SkillSplitEditor
          files={FILES}
          scope={SCOPE}
          settings={<div data-testid="settings" />}
          isTestPanelOpen={false}
          onOpenTestPanel={vi.fn()}
          onCloseTestPanel={vi.fn()}
          renderTestPanelControls={() => null}
          testPanelContent={<div data-testid="test-content" />}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>
  </Provider>
);

const renderEditor = (url = '/skills/7', props = {}) => render(editorTree(url, props));

const openMenu = path =>
  fireEvent.click(screen.getByTestId(`skill-file-menu-${path.replace(/[^\w-]/g, '_')}-button`));

describe('SkillSplitEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    smallWindow.current = false;
  });
  afterEach(() => cleanup());

  it('opens on Settings with the instructions beside the settings', () => {
    renderEditor();
    expect(screen.getByTestId('skill-split-editor')).toHaveAttribute('data-view', 'settings');
    expect(screen.getByTestId('settings')).toBeInTheDocument();
    expect(screen.getByTestId('instructions-pane')).toBeInTheDocument();
  });

  it('keeps the Files tab label on one line when the column is narrow', () => {
    renderEditor();
    expect(screen.getByTestId('skill-view-files')).toHaveStyle({ whiteSpace: 'nowrap' });
  });

  it('opens the file the address names, and nested folders in the tree', () => {
    renderEditor('/skills/7?view=files&file=scripts%2Flib%2Fpdf.py');
    expect(screen.getByTestId('file-viewer')).toHaveAttribute('data-path', 'scripts/lib/pdf.py');
    expect(screen.getByTestId('skill-file-row-scripts/lib/')).toBeInTheDocument();
    expect(screen.getByTestId('skill-file-row-scripts/lib/pdf.py')).toHaveAttribute('data-selected', 'true');
  });

  it('says so when the address names a file this version does not have', () => {
    renderEditor('/skills/7?view=files&file=gone.md');
    expect(screen.getByTestId('skill-file-missing')).toHaveTextContent('gone.md is not in this version.');
    expect(screen.queryByTestId('file-viewer')).not.toBeInTheDocument();
  });

  it('offers Test and Instructions on Files also when no file can be shown', () => {
    const onOpenTestPanel = vi.fn();
    renderEditor('/skills/7?view=files&file=gone.md', { onOpenTestPanel });
    expect(screen.getByTestId('skill-open-instructions')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('skill-test-button'));
    expect(onOpenTestPanel).toHaveBeenCalled();
  });

  it('asks before deleting a file, then deletes it', async () => {
    renderEditor('/skills/7?view=files');
    openMenu('scripts/fill.py');
    fireEvent.click(await screen.findByText('Delete'));

    const dialog = await screen.findByTestId('skill-file-delete-dialog');
    expect(actions.deletePath).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByTestId('skill-file-delete-confirm'));
    expect(actions.deletePath).toHaveBeenCalledWith('scripts/fill.py', false);
  });

  it('renames a folder by its path', async () => {
    renderEditor('/skills/7?view=files');
    openMenu('scripts/');
    fireEvent.click(await screen.findByText('Rename folder'));

    const input = await screen.findByTestId('skill-file-rename-input');
    fireEvent.change(input, { target: { value: 'tools' } });
    fireEvent.click(screen.getByTestId('skill-file-rename-confirm'));
    expect(actions.renamePath).toHaveBeenCalledWith('scripts', 'tools', true);
  });

  it('keeps only Download and Copy path on a read-only version, with no folder menu and no Add files', async () => {
    renderEditor('/skills/7?view=files', { readOnlyFiles: true });
    expect(screen.queryByTestId('skill-files-add')).not.toBeInTheDocument();
    expect(screen.queryByTestId('skill-file-menu-scripts_-button')).not.toBeInTheDocument();

    openMenu('scripts/fill.py');
    expect(await screen.findByText('Download')).toBeInTheDocument();
    expect(screen.getByText('Copy path')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Rename')).not.toBeInTheDocument();
  });

  it('gives the Test column a resize handle, and hides the other columns in full screen without unmounting them', () => {
    const settingsMounts = vi.fn();
    const Settings = () => {
      useEffect(settingsMounts, []);
      return <div data-testid="settings" />;
    };
    const { rerender } = renderEditor('/skills/7', { isTestPanelOpen: true, settings: <Settings /> });
    expect(screen.getByTestId('skill-test-panel-resize-handle')).toBeInTheDocument();
    expect(screen.getByTestId('settings')).toBeVisible();

    rerender(editorTree('/skills/7', { isTestPanelOpen: true, isFullScreen: true, settings: <Settings /> }));
    expect(screen.queryByTestId('skill-test-panel-resize-handle')).not.toBeInTheDocument();
    expect(screen.getByTestId('settings')).not.toBeVisible();
    expect(settingsMounts).toHaveBeenCalledTimes(1);
  });

  it('stacks the settings over the instructions in a narrow window with Test open', () => {
    smallWindow.current = true;
    renderEditor('/skills/7', { isTestPanelOpen: true });
    expect(screen.getByTestId('skill-settings-group')).toHaveAttribute('data-stacked', 'true');
  });

  it('hides the open file in a narrow window when the instructions open beside it', () => {
    smallWindow.current = true;
    renderEditor('/skills/7?view=files&panel=instructions');
    expect(screen.getByTestId('skill-file-column')).not.toBeVisible();
    expect(screen.getByTestId('instructions-pane')).toBeInTheDocument();
  });
});
