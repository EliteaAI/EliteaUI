// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, screen } from '@testing-library/react';

import ScheduleCell from '../ScheduleCell';
import { renderWithTheme } from './_testHelpers';

// the entity column names the entity and, on a second line, its version or its index

await vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/schedule', () => ({
  ScheduleEnabledSwitch: () => null,
  ScheduleRunStatusChip: () => null,
  formatRunStarted: () => '',
  isRotating: () => false,
  rotationText: () => '',
  toFullWebhookUrl: () => '',
  toRunStatusLabel: () => '',
  toWebhookTypeLabel: () => '',
}));
vi.mock('../IconWithLabel', () => ({ default: ({ label }) => <span data-testid="entity-label">{label}</span> }));

const column = { field: 'entity_name' };
const renderCell = row => renderWithTheme(<ScheduleCell column={column} row={row} />);

describe('ScheduleCell entity column', () => {
  afterEach(cleanup);

  it('shows the index name under the toolkit of a toolkit index row', () => {
    renderCell({ entity_type: 'toolkit_index', entity_name: 'Docs toolkit', index_name: 'handbook' });

    expect(screen.getByTestId('entity-label')).toHaveTextContent('Docs toolkit');
    expect(screen.getByText('handbook')).toBeInTheDocument();
  });

  it('shows the version name under an agent row', () => {
    renderCell({ entity_type: 'agent', entity_name: 'Helper', version_name: 'v2', index_name: 'ignored' });

    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.queryByText('ignored')).not.toBeInTheDocument();
  });

  it('shows no second line for a toolkit index row without an index name', () => {
    renderCell({ entity_type: 'toolkit_index', entity_name: 'Docs toolkit', version_name: 'v2' });

    expect(screen.queryByText('v2')).not.toBeInTheDocument();
  });
});
