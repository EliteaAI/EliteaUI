// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

vi.mock('@/[fsd]/entities/edit-entity-with-ai', () => ({
  TextDiffHighlight: props => (
    <div
      data-testid="diff"
      data-editable={String(Boolean(props.editable))}
    >{`${props.original}|${props.modified}`}</div>
  ),
}));
vi.mock('@/components/Icons/ArrowDownIcon', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BaseBtn: props => (
      <button
        type="button"
        data-base-button="true"
        data-variant={props.variant}
        aria-expanded={props['aria-expanded']}
        onClick={props.onClick}
        data-testid={props['data-testid']}
      >
        {props.children}
      </button>
    ),
  },
}));
vi.mock('@/[fsd]/entities/version', () => ({ buildVersionOption: vi.fn(), formatVersionMeta: () => 'meta' }));

const { default: CompareNestedAgentsStep } = await import('../CompareNestedAgentsStep');
const { matchNestedAgents } = await import('../../../lib/helpers/compareVersions.helpers');

const theme = createTheme({ palette: darkPalette });

const data = (overrides = {}) => ({
  instructions: 'same',
  welcome_message: '',
  conversation_starters: [],
  tools: [],
  ...overrides,
});
const entry = (name, overrides = {}) => ({
  key: `agent:${name}`,
  name,
  entityType: 'agent',
  data: data(),
  unavailable: false,
  children: [],
  ...overrides,
});

const renderStep = (left, right) =>
  render(
    <ThemeProvider theme={theme}>
      <CompareNestedAgentsStep
        leftVersion={{ name: 'mine' }}
        rightVersion={{ name: 'public' }}
        nestedRows={matchNestedAgents(left, right)}
      />
    </ThemeProvider>,
  );

describe('CompareNestedAgentsStep', () => {
  afterEach(() => cleanup());

  it('says so when neither version has sub-agents', () => {
    renderStep([], []);
    expect(screen.getByTestId('compare-nested-empty')).toHaveTextContent('Neither version has sub-agents.');
  });

  it('summarises how many sub-agents differ', () => {
    renderStep(
      [entry('Same'), entry('Edited')],
      [entry('Same'), entry('Edited', { data: data({ instructions: 'new' }) })],
    );
    expect(screen.getByTestId('compare-nested-summary')).toHaveTextContent('1 sub-agent differ.');
  });

  it('says there are no differences when every sub-agent is the same', () => {
    renderStep([entry('A')], [entry('A')]);
    expect(screen.getByTestId('compare-nested-summary')).toHaveTextContent(
      'No differences in the sub-agents.',
    );
  });

  it('labels each sub-agent with how it differs', () => {
    renderStep(
      [entry('Same'), entry('Edited'), entry('Mine')],
      [entry('Same'), entry('Edited', { data: data({ instructions: 'new' }) }), entry('Added')],
    );
    expect(screen.getByTestId('compare-nested-status-agent:Same')).toHaveTextContent('No differences');
    expect(screen.getByTestId('compare-nested-status-agent:Edited')).toHaveTextContent('Changed');
    expect(screen.getByTestId('compare-nested-status-agent:Mine')).toHaveTextContent('Only in your version');
    expect(screen.getByTestId('compare-nested-status-agent:Added')).toHaveTextContent(
      'Only in the public version',
    );
  });

  it('keeps a sub-agent closed until it is opened', () => {
    renderStep([entry('A')], [entry('A', { data: data({ instructions: 'new' }) })]);
    expect(screen.queryByTestId('diff')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('compare-nested-toggle-agent:A'));
    expect(screen.getAllByTestId('diff').length).toBeGreaterThan(0);
  });

  it('shows the instructions of both sides in an opened sub-agent, never editable', () => {
    renderStep(
      [entry('A', { data: data({ instructions: 'mine' }) })],
      [entry('A', { data: data({ instructions: 'theirs' }) })],
    );
    fireEvent.click(screen.getByTestId('compare-nested-toggle-agent:A'));
    const diffs = screen.getAllByTestId('diff');
    expect(diffs.map(node => node.textContent)).toEqual(
      expect.arrayContaining(['theirs|mine', 'mine|theirs']),
    );
    diffs.forEach(node => expect(node).toHaveAttribute('data-editable', 'false'));
  });

  it('shows the tools of both sides, matched by name', () => {
    renderStep(
      [
        entry('A', {
          data: data({
            tools: [{ name: 'Jira', type: 'jira', entityType: 'toolkit', matchKey: 'toolkit:jira:Jira' }],
          }),
        }),
      ],
      [
        entry('A', {
          data: data({
            tools: [
              { name: 'Jira', type: 'jira', entityType: 'toolkit', matchKey: 'toolkit:jira:Jira' },
              { name: 'GitHub', type: 'github', entityType: 'toolkit', matchKey: 'toolkit:github:GitHub' },
            ],
          }),
        }),
      ],
    );
    fireEvent.click(screen.getByTestId('compare-nested-toggle-agent:A'));
    const row = within(screen.getByTestId('compare-nested-agent-agent:A'));
    expect(row.getAllByText('Jira')).toHaveLength(2);
    expect(row.getAllByText('GitHub')).toHaveLength(1);
  });

  it('says which side a sub-agent is missing from', () => {
    renderStep([entry('Mine')], []);
    fireEvent.click(screen.getByTestId('compare-nested-toggle-agent:Mine'));
    expect(screen.getByText('Not present on this side.')).toBeInTheDocument();
  });

  it('says which side could not be loaded', () => {
    renderStep([entry('A', { data: null, unavailable: true })], [entry('A')]);
    fireEvent.click(screen.getByTestId('compare-nested-toggle-agent:A'));
    expect(screen.getByText('Could not be loaded.')).toBeInTheDocument();
    expect(screen.getByTestId('compare-nested-status-agent:A')).toHaveTextContent('Changed');
  });

  it('lists the sub-agents of a sub-agent below it, with their own state', () => {
    renderStep(
      [entry('Parent', { children: [entry('Child')] })],
      [entry('Parent', { children: [entry('Child', { data: data({ instructions: 'new' }) })] })],
    );
    expect(screen.getByTestId('compare-nested-agent-agent:Child')).toBeInTheDocument();
    expect(screen.getByTestId('compare-nested-status-agent:Child')).toHaveTextContent('Changed');
    // the parent reads as changed because of its child, and the count does not include it
    expect(screen.getByTestId('compare-nested-status-agent:Parent')).toHaveTextContent('Changed');
    expect(screen.getByTestId('compare-nested-summary')).toHaveTextContent('1 sub-agent differ.');
  });

  it('opens and closes a sub-agent', () => {
    renderStep([entry('A')], [entry('A')]);
    const toggle = screen.getByTestId('compare-nested-toggle-agent:A');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('uses the shared button for the toggle, not a bare button element', () => {
    renderStep([entry('A')], [entry('A')]);
    const toggle = screen.getByTestId('compare-nested-toggle-agent:A');
    expect(toggle).toHaveAttribute('data-base-button', 'true');
    expect(toggle).toHaveAttribute('data-variant', 'secondary');
  });

  it('opens a sub-agent with the instructions, the welcome message, the starters and the tools of both sides', () => {
    renderStep(
      [entry('A', { data: data({ welcome_message: 'hi', conversation_starters: ['one', 'two'] }) })],
      [entry('A', { data: data({ welcome_message: 'hello', conversation_starters: ['one'] }) })],
    );
    fireEvent.click(screen.getByTestId('compare-nested-toggle-agent:A'));
    const texts = screen.getAllByTestId('diff').map(node => node.textContent);
    expect(texts).toEqual(
      expect.arrayContaining(['same|same', 'hello|hi', 'hi|hello', 'one|one\ntwo', 'one\ntwo|one']),
    );
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('No tools attached.')).toBeInTheDocument();
  });
});
