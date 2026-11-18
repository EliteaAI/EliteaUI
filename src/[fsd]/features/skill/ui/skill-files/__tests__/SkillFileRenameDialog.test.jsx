// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastInfo: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn() }),
}));

const { default: SkillFileRenameDialog } = await import('../SkillFileRenameDialog');

const TAKEN = ['refs/a.md', 'refs/b.md', 'docs/a.md', 'LICENSE.txt'];
const theme = createTheme({ palette: darkPalette });
const onConfirm = vi.fn();

const rename = (path, isFolder, newPath) => {
  render(
    <ThemeProvider theme={theme}>
      <SkillFileRenameDialog
        open
        path={path}
        isFolder={isFolder}
        takenPaths={TAKEN}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    </ThemeProvider>,
  );
  fireEvent.change(screen.getByTestId('skill-file-rename-input'), { target: { value: newPath } });
  fireEvent.click(screen.getByTestId('skill-file-rename-confirm'));
};

describe('SkillFileRenameDialog', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it.each([
    ['a folder onto a folder that exists', 'refs', true, 'docs'],
    ['a folder onto a file', 'refs', true, 'license.TXT'],
    ['a file onto a folder', 'refs/a.md', false, 'DOCS'],
    ['a file into a path under a file', 'refs/a.md', false, 'LICENSE.txt/a.md'],
    ['a file onto another file in another letter case', 'refs/a.md', false, 'Refs/B.md'],
  ])('refuses to rename %s', (_case, path, isFolder, newPath) => {
    rename(path, isFolder, newPath);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('A file or folder with this path already exists')).toBeInTheDocument();
  });

  it.each([
    ['a file to a new letter case of its own name', 'refs/a.md', false, 'refs/A.md'],
    ['a folder to a new name', 'refs', true, 'references'],
    ['a folder to a new letter case of its own name', 'refs', true, 'Refs'],
    ['a folder into a folder of its own', 'refs', true, 'refs/old'],
  ])('renames %s', (_case, path, isFolder, newPath) => {
    rename(path, isFolder, newPath);
    expect(onConfirm).toHaveBeenCalledWith(newPath);
  });

  it('stores a path typed with ./ as the backend does, without it', () => {
    rename('refs/a.md', false, ' ././docs/a2.md ');
    expect(onConfirm).toHaveBeenCalledWith('docs/a2.md');
  });

  it('refuses a ./ path that names the same file', () => {
    rename('refs/a.md', false, './refs/a.md');
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('The new path must differ from the current one')).toBeInTheDocument();
  });
});
