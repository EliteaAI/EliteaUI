// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import ScheduleImportReport from '../ScheduleImportReport';

// the import report shows created, updated, skipped and failed groups with counts and icons.

const REPORT = {
  created: [
    { name: 'Daily', schedule_id: 1, note: 'agent renamed' },
    { name: 'Weekly', schedule_id: 2 },
  ],
  updated: [{ name: 'Nightly', schedule_id: 3, note: 'Key match. Owner kept.' }],
  skipped: [{ name: 'Old', reason: 'already exists' }],
  failed: [{ name: 'Bad', reason: 'invalid cron' }],
};

describe('ScheduleImportReport', () => {
  afterEach(cleanup);

  it('shows four groups with counts and an icon before each', () => {
    render(<ScheduleImportReport report={REPORT} />);
    const expected = {
      created: ['Created (2)', 'success'],
      updated: ['Updated (1)', 'updated'],
      skipped: ['Skipped (1)', 'info'],
      failed: ['Failed (1)', 'error'],
    };
    Object.entries(expected).forEach(([key, [title, icon]]) => {
      const group = screen.getByTestId(`import-report-${key}`);
      expect(within(group).getByText(title)).toBeInTheDocument();
      expect(within(group).getByTestId(`import-report-icon-${icon}`)).toBeInTheDocument();
    });
  });

  it('shows the Updated group after Created and before Skipped and Failed', () => {
    render(<ScheduleImportReport report={REPORT} />);
    const order = screen.getAllByTestId(/^import-report-(created|updated|skipped|failed)$/);
    expect(order.map(group => group.dataset.testid)).toEqual([
      'import-report-created',
      'import-report-updated',
      'import-report-skipped',
      'import-report-failed',
    ]);
  });

  it('lists each updated item with its name and note', () => {
    render(<ScheduleImportReport report={REPORT} />);
    const group = screen.getByTestId('import-report-updated');
    expect(within(group).getByText('Nightly - Key match. Owner kept.')).toBeInTheDocument();
  });

  it('hides the Updated group when it is empty or missing (older server)', () => {
    const { rerender } = render(<ScheduleImportReport report={{ ...REPORT, updated: [] }} />);
    expect(screen.queryByTestId('import-report-updated')).toBeNull();

    const { created, skipped, failed } = REPORT;
    rerender(<ScheduleImportReport report={{ created, skipped, failed }} />);
    expect(screen.queryByTestId('import-report-updated')).toBeNull();
    expect(screen.getByTestId('import-report-created')).toBeInTheDocument();
  });

  it('lists names with notes and reasons', () => {
    render(<ScheduleImportReport report={REPORT} />);
    expect(screen.getByText(/Daily/)).toBeInTheDocument();
    expect(screen.getByText(/agent renamed/)).toBeInTheDocument();
    expect(screen.getByText(/already exists/)).toBeInTheDocument();
    expect(screen.getByText(/invalid cron/)).toBeInTheDocument();
  });

  it('hides empty groups', () => {
    render(
      <ScheduleImportReport report={{ created: [], skipped: [], failed: [{ name: 'Bad', reason: 'x' }] }} />,
    );
    expect(screen.queryByTestId('import-report-created')).toBeNull();
    expect(screen.getByTestId('import-report-failed')).toBeInTheDocument();
  });

  it('lists duplicate names without key collisions', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ScheduleImportReport
        report={{
          failed: [
            { name: 'Dup', reason: 'a' },
            { name: 'Dup', reason: 'b' },
          ],
        }}
      />,
    );

    expect(screen.getAllByText(/Dup/)).toHaveLength(2);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('renders the items as a list', () => {
    render(<ScheduleImportReport report={REPORT} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });
});
