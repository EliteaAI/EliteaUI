// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import ScheduleRiskBlockBox from '../ScheduleRiskBlockBox';

// EL-7011 owner CR 2026-10-21: the red box under the entity when the risk check blocks the save (US-33)

const SIGNIN = [
  {
    code: 'personal_signin_required',
    toolkit: "GitHub toolkit 'github-personal'",
    reason: 'uses your own GitHub sign-in',
    fix: { entity_type: 'agent', id: 12, version_id: 31 },
  },
  {
    code: 'personal_signin_required',
    toolkit: 'Jira Cloud MCP server',
    reason: 'asks each user to sign in',
    fix: { entity_type: 'agent', id: 12, version_id: 31 },
  },
];
const STEPS = ['Review', 'Approve', 'Publish'].map(label => ({
  code: 'human_input_step',
  step: label.toLowerCase(),
  step_label: label,
  fix: { entity_type: 'pipeline', id: 9, version_id: 90 },
}));

const setup = props =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('light'))}>
      <ScheduleRiskBlockBox
        entityType="agent"
        entityId={7}
        versionId={71}
        {...props}
      />
    </ThemeProvider>,
  );

describe('EL-7011 owner CR ScheduleRiskBlockBox', () => {
  afterEach(cleanup);

  it('lists every personal sign-in of the agent in one box with the fix link', () => {
    setup({ blocking: SIGNIN });

    const boxes = screen.getAllByTestId('schedule-risk-block-box');
    expect(boxes).toHaveLength(1);
    const box = within(boxes[0]);
    expect(box.getByText(/needs a personal sign-in/)).toBeInTheDocument();
    expect(box.getByText(/You can't save this schedule/)).toBeInTheDocument();
    expect(box.getByText("GitHub toolkit 'github-personal'")).toBeInTheDocument();
    expect(box.getByText(/uses your own GitHub sign-in/)).toBeInTheDocument();
    expect(box.getByText('Jira Cloud MCP server')).toBeInTheDocument();
    expect(box.getAllByRole('listitem')).toHaveLength(2);
  });

  it('opens the editor named by the finding fix in a new tab, so the form keeps its input', () => {
    setup({ blocking: SIGNIN });

    const link = screen.getByRole('link', { name: /Open agent to change tools/ });
    expect(link).toHaveAttribute('href', '/agents/all/12/31');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('names the first human-input step of a pipeline and counts the others', () => {
    setup({ blocking: STEPS, entityType: 'pipeline', entityId: 1, versionId: 2 });

    expect(
      screen.getByText("This pipeline asks a person for input at step 'Review' and 2 more steps."),
    ).toBeInTheDocument();
    expect(screen.getByText("Scheduled runs can't answer it.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open pipeline to change steps/ })).toHaveAttribute(
      'href',
      '/pipelines/all/9/90',
    );
  });

  it('shows one box per cause kind and names the toolkit with no credential', () => {
    setup({ blocking: [...SIGNIN, { code: 'missing_credential', toolkit: 'x' }] });

    expect(screen.getAllByTestId('schedule-risk-block-box')).toHaveLength(2);
    expect(screen.getByText("Toolkit 'x' has no usable credential for the owner.")).toBeInTheDocument();
  });

  it('falls back to the form entity and version when a finding has no fix', () => {
    setup({ blocking: [{ code: 'missing_credential', toolkit: 'x' }] });

    expect(screen.getByRole('link', { name: /Open agent to change tools/ })).toHaveAttribute(
      'href',
      '/agents/all/7/71',
    );
  });

  it('ends the link at the entity when the fix has no version', () => {
    setup({
      blocking: [{ code: 'missing_credential', toolkit: 'x', fix: { entity_type: 'agent', id: 12 } }],
    });

    expect(screen.getByRole('link', { name: /Open agent to change tools/ })).toHaveAttribute(
      'href',
      '/agents/all/12',
    );
  });

  it('shows the server message of a blocking code it does not know', () => {
    setup({ blocking: [{ code: 'brand_new_block', message: 'Something blocks the run.' }] });

    expect(screen.getByText('Something blocks the run.')).toBeInTheDocument();
  });

  it('renders nothing without blocking findings', () => {
    setup({ blocking: [] });

    expect(screen.queryByTestId('schedule-risk-block-box')).not.toBeInTheDocument();
  });
});
