// @vitest-environment jsdom
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, render } from '@testing-library/react';

import SkillRunHistoryView from '../SkillRunHistoryView';

const containerProps = vi.hoisted(() => ({ current: null }));

vi.mock('@/[fsd]/entities/run-history/ui', () => ({
  RunHistoryContainer: props => {
    containerProps.current = props;
    return null;
  },
}));

vi.mock('@/[fsd]/features/chat', () => ({ ChatMessageList: () => null }));

vi.mock('@/[fsd]/features/settings', () => ({ DrawerPageHeader: () => null }));

vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => null }));

vi.mock('@/[fsd]/widgets/skill-run-history/lib/hooks', () => ({
  useSkillHistoryEntity: () => ({
    skillId: 70,
    skill: { name: 'Reviewer' },
    versions: [],
    entityProjectId: 3,
  }),
}));

const renderHistory = () =>
  render(
    <MemoryRouter initialEntries={['/skills/all/70/history']}>
      <Routes>
        <Route
          path="/skills/:tab/:skillId/history"
          element={<SkillRunHistoryView />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('SkillRunHistoryView execution type column', () => {
  afterEach(() => cleanup());

  it('labels the column like the agent and pipeline histories', () => {
    renderHistory();

    expect(containerProps.current.eventColumnLabel).toBe('Execution type');
  });

  it('tells an API run apart from a chat run', () => {
    renderHistory();

    const { decorateRow } = containerProps.current;
    expect(decorateRow({ id: 1, execution_type: 'api' }).event_label).toBe('API');
    expect(decorateRow({ id: 2, execution_type: 'chat' }).event_label).toBe('Chat');
  });
});
