// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import CreateSkillTabBar from '../CreateSkillTabBar';

const nav = vi.hoisted(() => ({ navigate: vi.fn(), search: '' }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => nav.navigate,
  useSearchParams: () => [new URLSearchParams(nav.search)],
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useCreateSkill: () => ({ onCreate: () => Promise.resolve({ id: 42 }), isCreating: false }),
}));
vi.mock('@/hooks/useNavBlocker', () => ({ default: () => ({}) }));
vi.mock('@/[fsd]/shared/ui', () => ({ Button: { DiscardButton: () => null } }));
vi.mock('@/pages/Common/Components', () => ({ TabBarItems: ({ children }) => <div>{children}</div> }));

const renderTabBar = () =>
  render(
    <Formik
      initialValues={{ name: '', description: '', version_details: { instructions: '' } }}
      onSubmit={() => {}}
    >
      {({ setValues }) => (
        <>
          <button
            data-testid="fill"
            onClick={() => setValues({ name: 'a', description: 'b', version_details: { instructions: 'c' } })}
          />
          <CreateSkillTabBar />
        </>
      )}
    </Formik>,
  );

const saveSkill = async () => {
  renderTabBar();
  fireEvent.click(screen.getByTestId('fill'));
  await waitFor(() => expect(screen.getByTestId('skill-save-button')).not.toBeDisabled());
  fireEvent.click(screen.getByTestId('skill-save-button'));
  await waitFor(() => expect(nav.navigate).toHaveBeenCalled());
  return nav.navigate.mock.calls[0][0];
};

describe('CreateSkillTabBar save', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    nav.search = '';
  });

  it('returns to the source agent with the new skill id', async () => {
    nav.search = `source_application_id=7&return_url=${encodeURIComponent('/agents/all/7?tab=config')}`;

    const target = await saveSkill();

    expect(target.pathname).toBe('/agents/all/7');
    expect(new URLSearchParams(target.search).get('newSkillId')).toBe('42');
  });

  it('opens the new skill when there is no source agent', async () => {
    const target = await saveSkill();

    expect(target.pathname).toMatch(/\/42$/);
  });
});
