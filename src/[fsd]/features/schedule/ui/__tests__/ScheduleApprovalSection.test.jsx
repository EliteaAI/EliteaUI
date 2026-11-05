// @vitest-environment jsdom
import { Fragment } from 'react';

import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { APPROVAL_RULE_INFO } from '../../lib/constants';
import ScheduleApprovalSection, { APPROVAL_RULE_ITEMS } from '../ScheduleApprovalSection';

let allowRunWithoutAsking = true;

vi.mock('@/[fsd]/entities/schedule', () => ({
  useGetScheduleSettingsQuery: () => ({ data: { allow_run_without_asking: allowRunWithoutAsking } }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));
vi.mock('@/[fsd]/shared/ui/checkbox/RadioButtonGroup', () => ({
  default: ({ items, value, onChange, testId }) => (
    <div data-testid={testId}>
      {items.map(item => (
        <Fragment key={item.value}>
          <button
            type="button"
            data-testid={`${testId}-${item.value}`}
            aria-pressed={item.value === value}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
          {item.info && (
            <InfoTooltip
              infoTooltip={item.info}
              pinnable={item.infoPinnable}
              label={item.infoLabel}
              testId={`${testId}-${item.value}-info`}
            />
          )}
        </Fragment>
      ))}
    </div>
  ),
}));

const renderSection = (props = {}) =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('light'))}>
      <MemoryRouter>
        <ScheduleApprovalSection
          rule="pause_and_ask"
          ruleChanged={false}
          canChangeProjectSettings={false}
          error=""
          onChange={vi.fn()}
          {...props}
        />
      </MemoryRouter>
    </ThemeProvider>,
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

  it.each([
    ['pause_and_ask', APPROVAL_RULE_INFO.pause_and_ask],
    ['run_without_asking', APPROVAL_RULE_INFO.run_without_asking],
  ])('opens the info text of %s when its icon gets keyboard focus', async (value, text) => {
    renderSection();

    const icon = screen.getByTestId(`schedule-approval-rule-${value}-info`);
    expect(icon).toHaveAttribute('tabindex', '0');
    expect(screen.queryByText(text)).not.toBeInTheDocument();

    act(() => icon.focus());

    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it('names each info icon after its option', () => {
    renderSection();

    expect(APPROVAL_RULE_ITEMS.map(item => item.infoLabel)).toEqual([
      'More info about Pause and ask me',
      'More info about Run without asking',
    ]);
    expect(screen.getByLabelText('More info about Pause and ask me')).toBeInTheDocument();
    expect(screen.getByLabelText('More info about Run without asking')).toBeInTheDocument();
  });

  it('opens the info text on hover', async () => {
    renderSection();

    fireEvent.mouseEnter(screen.getByTestId('schedule-approval-rule-run_without_asking-info'));

    expect(await screen.findByText(APPROVAL_RULE_INFO.run_without_asking)).toBeInTheDocument();
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
