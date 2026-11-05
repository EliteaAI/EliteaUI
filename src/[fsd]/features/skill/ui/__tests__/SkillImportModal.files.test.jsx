// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import SkillImportModal from '../import/SkillImportModal';

vi.mock('react-redux', () => ({
  useSelector: selector =>
    selector({ settings: { projects: [{ id: 2, name: 'Private' }] }, user: { permissions: [] } }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/api/auth', () => ({ useLazyCheckPermissionListQuery: () => [vi.fn()] }));
vi.mock('@/[fsd]/entities/version', () => ({ LATEST_VERSION_NAME: 'base' }));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@/[fsd]/shared/lib/constants', () => ({ ProjectSelectConstants: { ProjectSelectShowMode: {} } }));
vi.mock('@/common/constants', () => ({ PERMISSIONS: { skills: { create: 'skills.create' } } }));
vi.mock('@/components/ProjectSelect', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui', () => ({
  Button: { BaseBtn: ({ children }) => <button>{children}</button> },
  Modal: {
    BaseModal: ({ content, actions }) => (
      <div>
        {content}
        {actions}
      </div>
    ),
  },
}));
vi.mock('@/[fsd]/entities/import-wizard/ui', () => ({
  IWModalEntityCardWrapper: ({ children }) => <div>{children(vi.fn())}</div>,
  IWModalEntityTextField: ({ title, description, testId }) => (
    <div
      data-testid={testId}
      data-title={title}
    >
      {description}
    </div>
  ),
}));

const SKILL = { name: 'pdf', description: 'Fills PDF forms', instructions: 'Read forms.md first.' };

const theme = createTheme({ palette: lightPalette });

const renderModal = filePaths =>
  render(
    <ThemeProvider theme={theme}>
      <SkillImportModal
        open
        skill={{ ...SKILL, filePaths }}
      />
    </ThemeProvider>,
  );

describe('SkillImportModal file list', () => {
  afterEach(cleanup);

  it('lists the files a skill ZIP brings with it', () => {
    renderModal(['forms.md', 'scripts/fill.py']);

    const files = screen.getByTestId('skill-import-preview-files');
    expect(files).toHaveAttribute('data-title', 'Files (2)');
    expect(files.textContent).toBe('forms.md\nscripts/fill.py');
  });

  it('shows no file list for a Markdown skill', () => {
    renderModal([]);

    expect(screen.getByTestId('skill-import-preview-instructions')).toBeInTheDocument();
    expect(screen.queryByTestId('skill-import-preview-files')).toBeNull();
  });
});
