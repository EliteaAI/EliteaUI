// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { PipelineStatus } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import RunStateDialog from '../RunStateDialog';

vi.mock('@/[fsd]/features/chat', () => ({}));
vi.mock('@/components/PipelineStateViewModal', () => ({ default: () => null }));
vi.mock('@/[fsd]/features/pipelines/flow-editor/ui/state/StateItemView', () => ({
  default: ({ valueBefore, valueAfter }) => (
    <div data-testid="state-values">{`${valueBefore} → ${valueAfter}`}</div>
  ),
}));

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const theme = createTheme({ palette: lightPalette });
const step = (id, value, groupId, isNested) => ({
  id,
  state: { value },
  group_id: groupId,
  is_nested: isNested,
  created_at: 1700000000000,
  status: PipelineStatus.Completed,
});

const renderDialog = (timeline, groupedTimeline) =>
  render(
    <ThemeProvider theme={theme}>
      <RunStateDialog
        open
        data={{ label: 'Test run', status: PipelineStatus.Completed, timeline, groupedTimeline }}
        state={{ value: '' }}
        editorHeight={600}
        editorWidth={1000}
      />
    </ThemeProvider>,
  );
const dot = index => screen.queryByTestId(`pipeline-run-details-timeline-step-${index}`);

describe('RunStateDialog timeline groups', () => {
  it('reveals consecutive steps and preserves the correct state scope when selecting or collapsing', () => {
    const first = step('First', 'pipeline first');
    const parent = { ...step('Parent node', 'pipeline parent', 'call-1'), group_label: 'Nested agent' };
    const child1 = step('First child', 'child first', 'call-1', true);
    const child2 = step('Second child', 'child second', 'call-1', true);
    const last = step('Last', 'pipeline last');
    const separate = step('Later callback', 'pipeline later', 'call-1', true);
    renderDialog([first, parent, last], [first, parent, child1, child2, last, separate]);

    const timeline = within(screen.getByRole('region', { name: 'Pipeline timeline steps' }));
    const toggle = timeline.getByRole('button', { name: 'Expand Nested agent (3 steps)' });
    expect(timeline.getByText('Nested agent')).toBeVisible();
    expect(timeline.queryByText('First child')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(dot(2)).not.toBeInTheDocument();
    expect(dot(3)).not.toBeInTheDocument();
    expect(dot(5)).toBeInTheDocument();
    expect(timeline.getAllByRole('button')).toHaveLength(1);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(timeline.getByText('Parent node')).toBeVisible();
    expect(timeline.getByText('First child')).toBeVisible();
    fireEvent.click(dot(2));
    expect(screen.getByTestId('state-values')).toHaveTextContent(/^ → child first$/u, {
      normalizeWhitespace: false,
    });
    fireEvent.click(dot(3));
    expect(screen.getByTestId('state-values')).toHaveTextContent('child first → child second');
    fireEvent.click(toggle);
    expect(dot(3)).not.toBeInTheDocument();
    expect(screen.getByTestId('state-values')).toHaveTextContent('pipeline first → pipeline parent');

    fireEvent.click(dot(4));
    expect(screen.getByTestId('state-values')).toHaveTextContent('pipeline parent → pipeline last');
  });

  it('shows the step count on a collapsed group and hides it once expanded', () => {
    const parent = { ...step('Parent node', 'parent', 'call-1'), group_label: 'Nested agent' };
    const children = [
      step('First child', 'first', 'call-1', true),
      step('Second child', 'second', 'call-1', true),
    ];
    renderDialog([parent], [parent, ...children]);

    expect(screen.getByTestId('pipeline-run-details-timeline-group-count-0')).toHaveTextContent('3');

    fireEvent.click(screen.getByRole('button', { name: 'Expand Nested agent (3 steps)' }));
    expect(screen.queryByTestId('pipeline-run-details-timeline-group-count-0')).not.toBeInTheDocument();
  });

  it('expands and collapses every group with the "Expand all steps" switch', () => {
    const first = { ...step('A1', 'a1', 'call-1'), group_label: 'Agent A' };
    const a2 = step('A2', 'a2', 'call-1', true);
    const second = { ...step('B1', 'b1', 'call-2'), group_label: 'Agent B' };
    const b2 = step('B2', 'b2', 'call-2', true);
    renderDialog([first, second], [first, a2, second, b2]);

    const expandAll = screen.getByTestId('pipeline-run-details-timeline-expand-all');
    expect(expandAll).not.toBeChecked();
    expect(dot(1)).not.toBeInTheDocument();
    expect(dot(3)).not.toBeInTheDocument();

    fireEvent.click(expandAll);
    expect(dot(1)).toBeInTheDocument();
    expect(dot(3)).toBeInTheDocument();

    // A single group can still be collapsed while the mode is on.
    fireEvent.click(screen.getByRole('button', { name: 'Collapse Agent A (2 steps)' }));
    expect(dot(1)).not.toBeInTheDocument();
    expect(dot(3)).toBeInTheDocument();

    fireEvent.click(expandAll);
    expect(dot(3)).not.toBeInTheDocument();
  });

  it('moves the selection to the group head when "Expand all steps" is switched off', () => {
    const parent = { ...step('Parent', 'parent', 'call-1'), group_label: 'Agent' };
    const child = step('Child', 'child', 'call-1', true);
    renderDialog([parent], [parent, child]);

    fireEvent.click(screen.getByTestId('pipeline-run-details-timeline-expand-all'));
    fireEvent.click(dot(1));
    expect(screen.getByTestId('state-values')).toHaveTextContent(/^ → child$/u, {
      normalizeWhitespace: false,
    });
    fireEvent.click(screen.getByTestId('pipeline-run-details-timeline-expand-all'));
    expect(screen.getByTestId('state-values')).toHaveTextContent(/^ → parent$/u, {
      normalizeWhitespace: false,
    });
  });

  it('hides the switch when no step belongs to a group', () => {
    renderDialog([step('First', 'one'), step('Second', 'two')]);
    expect(screen.queryByTestId('pipeline-run-details-timeline-expand-all')).not.toBeInTheDocument();
  });

  it('caps a large step count on the badge and keeps the exact number in its label', () => {
    const parent = { ...step('Parent node', 'parent', 'call-1'), group_label: 'Nested agent' };
    const children = Array.from({ length: 149 }, (_, i) => step(`Child ${i}`, `child ${i}`, 'call-1', true));
    renderDialog([parent], [parent, ...children]);

    const badge = screen.getByTestId('pipeline-run-details-timeline-group-count-0');
    expect(badge).toHaveTextContent(/^99\+$/u);
    expect(badge).toHaveAttribute('aria-label', '150 steps in Nested agent');
    expect(screen.getByRole('button', { name: 'Expand Nested agent (150 steps)' })).toBeVisible();
  });

  it('renders runs without grouped data as ordinary steps', () => {
    renderDialog([step('First', 'one'), step('Second', 'two')]);

    expect(
      within(screen.getByRole('region', { name: 'Pipeline timeline steps' })).queryByRole('button'),
    ).toBeNull();
    fireEvent.click(dot(1));
    expect(screen.getByTestId('state-values')).toHaveTextContent('one → two');
  });
});
