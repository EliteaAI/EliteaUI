// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ScheduleDraftRuns from '../ScheduleDraftRuns';

// the Runs card of the Create page: the view's ref must reach the card, so a #runs link can scroll to it

const mocks = vi.hoisted(() => ({ cardRef: { current: null } }));

vi.mock('../../lib/hooks/useScheduleRunsView.hooks', () => ({
  useScheduleRunsView: () => ({ cardRef: mocks.cardRef }),
}));
vi.mock('../ScheduleRunsCard', async () => {
  const { forwardRef } = await import('react');
  return {
    default: forwardRef((props, ref) => (
      <div
        ref={ref}
        data-testid="runs-card-stub"
      />
    )),
  };
});

describe('ScheduleDraftRuns', () => {
  afterEach(() => {
    cleanup();
    mocks.cardRef.current = null;
  });

  it('passes the ref of the runs view to the card', () => {
    render(
      <ScheduleDraftRuns
        entityType="agent"
        applicationId={3}
      />,
    );

    expect(mocks.cardRef.current).toBe(screen.getByTestId('runs-card-stub'));
  });
});
