// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ScheduleRunsFilters from '../ScheduleRunsFilters';

// #7456 review: the Type filter names a sample run as the card does

vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: ({ options, 'data-testid': testId }) => (
    <ul data-testid={testId}>
      {options.map(option => (
        <li key={option.value}>{option.label}</li>
      ))}
    </ul>
  ),
}));

const RUNS = [
  { id: 2, trigger: 'test', status: 'success' },
  { id: 1, trigger: 'webhook', status: 'success' },
];

const renderFilters = isWebhook =>
  render(
    <ScheduleRunsFilters
      runs={RUNS}
      trigger="all"
      status="all"
      isWebhook={isWebhook}
      onTriggerChange={vi.fn()}
      onStatusChange={vi.fn()}
    />,
  );

describe('ScheduleRunsFilters', () => {
  afterEach(cleanup);

  it('labels a test run of a webhook "Webhook (sample)"', () => {
    renderFilters(true);
    expect(screen.getByTestId('schedule-runs-filter-trigger')).toHaveTextContent('Webhook (sample)');
    expect(screen.getByTestId('schedule-runs-filter-trigger')).not.toHaveTextContent('Test');
  });

  it('keeps "Test" for a schedule', () => {
    renderFilters(false);
    expect(screen.getByTestId('schedule-runs-filter-trigger')).toHaveTextContent('Test');
  });
});
