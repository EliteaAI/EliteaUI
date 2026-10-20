// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import ScheduleImportReport from '../ScheduleImportReport';

// EL-7011 R3.3: the import report shows created, skipped and failed groups with counts and icons.

const REPORT = {
  created: [{ name: 'Daily', schedule_id: 1, note: 'agent renamed' }, { name: 'Weekly', schedule_id: 2 }],
  skipped: [{ name: 'Old', reason: 'already exists' }],
  failed: [{ name: 'Bad', reason: 'invalid cron' }],
};

describe('EL-7011 R3.3 ScheduleImportReport', () => {
  afterEach(cleanup);

  it('shows three groups with counts and an icon before each', () => {
    render(<ScheduleImportReport report={REPORT} />);
    const expected = { created: ['Created (2)', 'success'], skipped: ['Skipped (1)', 'info'], failed: ['Failed (1)', 'error'] };
    Object.entries(expected).forEach(([key, [title, icon]]) => {
      const group = screen.getByTestId(`import-report-${key}`);
      expect(within(group).getByText(title)).toBeInTheDocument();
      expect(within(group).getByTestId(`import-report-icon-${icon}`)).toBeInTheDocument();
    });
  });

  it('lists names with notes and reasons', () => {
    render(<ScheduleImportReport report={REPORT} />);
    expect(screen.getByText(/Daily/)).toBeInTheDocument();
    expect(screen.getByText(/agent renamed/)).toBeInTheDocument();
    expect(screen.getByText(/already exists/)).toBeInTheDocument();
    expect(screen.getByText(/invalid cron/)).toBeInTheDocument();
  });

  it('hides empty groups', () => {
    render(<ScheduleImportReport report={{ created: [], skipped: [], failed: [{ name: 'Bad', reason: 'x' }] }} />);
    expect(screen.queryByTestId('import-report-created')).toBeNull();
    expect(screen.getByTestId('import-report-failed')).toBeInTheDocument();
  });
});
