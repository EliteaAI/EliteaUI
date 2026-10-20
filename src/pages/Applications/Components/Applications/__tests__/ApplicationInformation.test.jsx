// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ApplicationInformation from '../ApplicationInformation';

// EL-7011 US-37 R2.5: the information panel shows the trigger type only, never a schedule info row.

vi.mock('formik', () => ({
  useFormikContext: () => ({ values: { id: 7, version_details: { id: 70, agent_type: 'pipeline' } } }),
}));
vi.mock('@/[fsd]/features/agent/ui/agent-details/configurations/index.js', () => ({
  ConfigurationModal: { StyledShowContextModal: () => null },
}));
vi.mock('@/[fsd]/features/pipelines/flow-editor/ui/settings', () => ({
  ScheduleInfoDisplay: () => <div data-testid="schedule-info" />,
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProject: () => ({ id: 1 }) }));
vi.mock('@/[fsd]/shared/ui/accordion/BasicAccordion', () => ({
  default: ({ items }) => <div>{items.map(item => <div key={item.title}>{item.content}</div>)}</div>,
}));
vi.mock('@/[fsd]/shared/ui/button', () => ({ CopyToClipboardButton: () => null }));
vi.mock('@/api/applications', () => ({
  useForkedFromApplicationDetailsQuery: () => ({}),
  useGetPipelineTriggerQuery: () => ({
    data: { type: 'schedule', cron: '0 * * * *', timezone: 'UTC', last_run: null },
  }),
}));
vi.mock('@/common/utils.jsx', () => ({ buildForkedEntityHref: () => '', capitalizeFirstChar: s => s }));
vi.mock('@/components/Fork/LabelLinkWithToolTip.jsx', () => ({ LabelLinkWithToolTip: () => null }));

describe('ApplicationInformation EL-7011 R2.5', () => {
  afterEach(cleanup);

  it('shows the trigger type but no schedule info row', () => {
    render(<ApplicationInformation />);
    expect(screen.getByTestId('information-trigger-row')).toHaveTextContent('Schedule');
    expect(screen.queryByTestId('schedule-info')).not.toBeInTheDocument();
  });
});
