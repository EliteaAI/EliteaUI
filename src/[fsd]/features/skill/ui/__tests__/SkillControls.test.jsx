// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('formik', () => ({
  useFormikContext: () => ({ values: { versions: [], meta: {}, version_details: { name: 'base' } } }),
}));
vi.mock('react-redux', () => ({ useSelector: selector => selector({ importWizard: {} }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/[fsd]/entities/version', () => ({ LATEST_VERSION_NAME: 'base' }));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useForkSkill: () => ({}),
  usePublishSkillMenu: () => ({}),
  useSkillExport: () => ({}),
  useUnpublishSkillMenu: () => ({}),
}));
vi.mock('@/[fsd]/shared/lib/constants', () => ({
  PinEntityConstants: { PinEntityType: { Skill: 'skill' } },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useProjectEntityLink: () => ({}),
  useProjectType: () => ({ isPrivate: true }),
  useSelectedProjectId: () => 2,
  useToast: () => ({}),
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Controls: {
    ControlsDropdown: ({ menuItems }) => (
      <ul data-testid="menu">
        {menuItems.map(item => (
          <li
            key={item.key}
            data-key={item.key}
            onClick={item.onClick}
          >
            {typeof item.label === 'string' ? item.label : item.key}
          </li>
        ))}
      </ul>
    ),
  },
}));
vi.mock('@/[fsd]/widgets/pin-toggler', () => ({
  usePin: () => ({}),
  usePinMenu: () => ({ pinMenuItem: { label: 'Pin to top' } }),
}));
vi.mock('@/[fsd]/shared/ui/icon', () => ({ RunHistoryIcon: () => null }));
vi.mock('@/common/constants', () => ({
  PERMISSIONS: { skills: { update: 'update', delete: 'delete' }, versions: { delete: 'delete' } },
  SkillsTabs: ['all'],
}));
vi.mock('@/common/utils.jsx', () => ({ buildErrorMessage: vi.fn() }));
vi.mock('@/components/CopyLinkToEntityButton.jsx', () => ({
  useCopyLinkMenu: ({ key, label }) => ({ copyLinkMenuItem: { key, label } }),
}));
vi.mock('@/components/Icons/DeleteIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/DifferenceIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/ExportIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/ForkIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/PinIcon', () => ({ default: () => null }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/routes', () => ({ default: { Skills: '/skills' } }));
vi.mock('../../api', () => ({ useDeleteSkillMutation: () => [vi.fn()] }));

const { default: SkillControls } = await import('../SkillControls');

const theme = createTheme({ palette: darkPalette });

describe('SkillControls Run History', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('sits right before Delete skill and opens the history', () => {
    const onShowHistory = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <SkillControls
          skillId={10}
          currentVersionId={22}
          onShowHistory={onShowHistory}
        />
      </ThemeProvider>,
    );

    const keys = [...screen.getByTestId('menu').querySelectorAll('li')].map(el => el.dataset.key);
    expect(keys.indexOf('run-history')).toBe(keys.indexOf('delete-skill') - 1);

    fireEvent.click(screen.getByText('Run History'));
    expect(onShowHistory).toHaveBeenCalledTimes(1);
  });
});
