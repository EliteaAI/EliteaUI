// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleApprovalSection from '../ScheduleApprovalSection';

let allowRunWithoutAsking = true;

vi.mock('@/[fsd]/entities/schedule', () => ({
  useGetScheduleSettingsQuery: () => ({ data: { allow_run_without_asking: allowRunWithoutAsking } }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));
vi.mock('@/[fsd]/shared/ui/checkbox/RadioButtonGroup', () => ({
  default: ({ items, value, onChange, testId }) => (
    <div data-testid={testId}>
      {items.map(item => (
        <button
          key={item.value}
          type="button"
          data-testid={`${testId}-${item.value}`}
          aria-pressed={item.value === value}
          disabled={item.disabled}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

const renderSection = (props = {}) =>
  render(
    <MemoryRouter>
      <ScheduleApprovalSection
        rule="pause_and_ask"
        ruleChanged={false}
        canChangeProjectSettings={false}
        error=""
        onChange={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );

describe('ScheduleApprovalSection', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    allowRunWithoutAsking = true;
  });

  it('reports the chosen rule', () => {
    const onChange = vi.fn();
    renderSection({ onChange });

    fireEvent.click(screen.getByTestId('schedule-approval-rule-run_without_asking'));

    expect(onChange).toHaveBeenCalledWith('run_without_asking');
    expect(screen.queryByText(/does not allow running without asking/)).not.toBeInTheDocument();
  });

  it('disables run without asking and explains why when the project forbids it', () => {
    allowRunWithoutAsking = false;
    renderSection({ canChangeProjectSettings: true });

    expect(screen.getByTestId('schedule-approval-rule-run_without_asking')).toBeDisabled();
    expect(screen.getByText(/does not allow running without asking/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Project General/ })).toBeInTheDocument();
    expect(screen.getByTestId('schedule-approval-rule-group')).toHaveAttribute(
      'aria-describedby',
      'schedule-approval-rule-hint',
    );
  });

  it('shows who confirmed the rule and the field error', () => {
    renderSection({
      confirmedBy: 'Ann',
      confirmedAt: '2026-10-21T10:00:00Z',
      error: 'Pick a rule',
    });

    expect(screen.getByText('Confirmed by Ann on 21 Oct 2026')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a rule');
  });

  it('leaves out the date when the confirmation date is invalid', () => {
    renderSection({ confirmedBy: 'Ann', confirmedAt: 'not a date' });

    expect(screen.getByText('Confirmed by Ann')).toBeInTheDocument();
  });
});
