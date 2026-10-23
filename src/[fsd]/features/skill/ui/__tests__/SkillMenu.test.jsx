// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import SkillMenu from '../SkillMenu';

const server = vi.hoisted(() => ({ skills: [], requestedPages: [] }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));
vi.mock('@/[fsd]/features/skill/api', async () => {
  const { useEffect, useRef, useState } = await vi.importActual('react');
  const { PAGE_SIZE } = await vi.importActual('@/common/constants');
  return {
    useLazySkillDetailsQuery: () => [vi.fn()],
    useSkillListQuery: ({ page = 0 }, { skip }) => {
      const [currentData, setCurrentData] = useState();
      const [isFetching, setIsFetching] = useState(false);
      const inFlight = useRef(false);
      useEffect(() => {
        if (skip || inFlight.current) return;
        inFlight.current = true;
        server.requestedPages.push(page);
        setIsFetching(true);
        const rows = server.skills.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
        Promise.resolve().then(() => {
          setCurrentData(previous => ({
            rows: page === 0 ? rows : [...(previous?.rows || []), ...rows],
            total: server.skills.length,
          }));
          inFlight.current = false;
          setIsFetching(false);
        });
      }, [skip, page]);
      return { currentData: skip ? undefined : currentData, isFetching };
    },
  };
});
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({ useAttachSkill: () => ({ attachSkill: vi.fn() }) }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useDebounceValue: value => value,
  useSelectedProjectId: () => 2,
  useToast: () => ({ toastError: vi.fn() }),
}));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@/[fsd]/shared/ui/button/BaseBtn', () => ({
  BUTTON_VARIANTS: {},
  default: ({ onClick, children }) => (
    <button
      data-testid="agent-add-skill-button"
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Dropdown: {
    UnifiedDropdown: ({ open, items, emptyMessage, onScroll }) =>
      open ? (
        <ul
          data-testid="skill-options"
          onScroll={onScroll}
        >
          {items.length ? items.map(item => <li key={item.key}>{item.label}</li>) : emptyMessage}
        </ul>
      ) : null,
  },
}));

const projectSkills = count =>
  Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `skill-${index + 1}` }));

const openMenu = attachedSkillIds => {
  render(
    <SkillMenu
      applicationId={1}
      entityVersionId={10}
      attachedSkillIds={attachedSkillIds}
    />,
  );
  fireEvent.click(screen.getByTestId('agent-add-skill-button'));
};

describe('SkillMenu', () => {
  beforeEach(() => {
    server.skills = projectSkills(60);
    server.requestedPages = [];
  });
  afterEach(() => cleanup());

  it('offers unattached skills when every skill on the first page is already attached', async () => {
    openMenu(projectSkills(24).map(skill => skill.id));

    await waitFor(() => expect(screen.getByTestId('skill-options')).toHaveTextContent('skill-25'));
    expect(screen.getByTestId('skill-options')).not.toHaveTextContent(/skill-24\b/);
  });

  it('loads the next page when the user scrolls a full list to the bottom', async () => {
    openMenu([]);

    await waitFor(() => expect(screen.getByTestId('skill-options')).toHaveTextContent('skill-20'));
    expect(server.requestedPages).toEqual([0]);

    fireEvent.scroll(screen.getByTestId('skill-options'));

    await waitFor(() => expect(screen.getByTestId('skill-options')).toHaveTextContent('skill-21'));
    expect(server.requestedPages).toEqual([0, 1]);
  });

  it('requests every page in order and stops once the project has no more skills', async () => {
    openMenu(server.skills.map(skill => skill.id));

    await waitFor(() => expect(server.requestedPages).toEqual([0, 1, 2]));
    expect(screen.getByTestId('skill-options')).toHaveTextContent('No skills available');
  });
});
