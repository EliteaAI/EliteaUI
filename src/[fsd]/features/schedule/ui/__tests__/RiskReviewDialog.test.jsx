// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import { APPROVAL_RULE_INFO } from '../../lib/constants';
import RiskReviewDialog from '../RiskReviewDialog';

// The toolkit icon reads the store; the dialog test needs only its place
vi.mock('@/[fsd]/shared/ui/icon', () => ({ EntityIcon: () => <span data-testid="risk-tool-icon" /> }));
// The shared input needs the toast provider; a plain input with the same props stands in
vi.mock('@/[fsd]/shared/ui/input/StyledInputEnhancer', () => ({
  default: ({ value, onChange, inputProps }) => (
    <input
      value={value}
      onChange={onChange}
      {...inputProps}
    />
  ),
}));

// the dialog "Review risks before scheduling" opened on Save

const TOOLS = [
  {
    code: 'sensitive_action',
    toolkit: 'Outlook',
    toolkit_type: 'outlook',
    tool: 'send_email',
    badge: 'sends_messages',
    effect: 'Sends e-mail to people inside and outside EPAM',
  },
  {
    code: 'sensitive_action',
    toolkit: 'Jira',
    toolkit_type: 'jira',
    tool: 'delete_issue',
    badge: 'deletes_data',
    effect: "Deletes Jira issues. You can't undo this.",
  },
  {
    code: 'sensitive_action',
    toolkit: 'Shell',
    toolkit_type: 'shell',
    tool: 'run',
    effect: 'Runs a command',
  },
  {
    code: 'personal_credential',
    toolkit: 'GitHub',
    toolkit_type: 'github',
    tool: null,
    badge: 'personal_credential',
    effect: "Runs with the owner's personal GitHub credential.",
  },
];

const setup = (props = {}) => {
  const handlers = { onCancel: vi.fn(), onConfirm: vi.fn() };
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('light'))}>
      <MemoryRouter>
        <RiskReviewDialog
          open
          entityLabel="Digest bot v3"
          scheduleName="Daily digest"
          tools={TOOLS}
          runWithoutAskingAllowed
          {...handlers}
          {...props}
        />
      </MemoryRouter>
    </ThemeProvider>,
  );
  return handlers;
};

const confirmButton = () => screen.getByRole('button', { name: 'Confirm' });
const pickRunWithoutAsking = () => fireEvent.click(screen.getByRole('radio', { name: /Run without asking/ }));
const typeName = text =>
  fireEvent.change(screen.getByLabelText(/Type the schedule name/), { target: { value: text } });

const WAITING = [
  { code: 'personal_signin_required', toolkit: 'GitHub' },
  { code: 'missing_credential', toolkit: 'Jira' },
];

describe('RiskReviewDialog', () => {
  afterEach(cleanup);

  it('lists the toolkits that need a sign-in as a warning under "Pause and ask me"', () => {
    const { onConfirm } = setup({ waiting: WAITING });

    const note = screen.getByTestId('risk-review-waiting');
    expect(note).toHaveTextContent('the run waits for your approval');
    expect(note).toHaveTextContent('GitHub');
    expect(note).toHaveTextContent('Jira');
    expect(confirmButton()).toBeEnabled();
    fireEvent.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith({ rule: 'pause_and_ask' });
  });

  it('blocks "Run without asking" while a toolkit needs a sign-in', () => {
    setup({ waiting: WAITING });

    pickRunWithoutAsking();
    typeName('Daily digest');

    expect(screen.getByTestId('risk-review-waiting')).toHaveTextContent("You can't save this schedule");
    expect(confirmButton()).toBeDisabled();
  });

  it('shows no waiting note without such toolkits', () => {
    setup();

    expect(screen.queryByTestId('risk-review-waiting')).not.toBeInTheDocument();
  });

  it('names the entity and shows one card per tool with its effect and badge', () => {
    setup();

    expect(screen.getByText('Review risks before scheduling')).toBeInTheDocument();
    expect(screen.getByText('Digest bot v3')).toBeInTheDocument();
    const cards = screen.getAllByTestId('risk-tool-card');
    expect(cards).toHaveLength(4);
    expect(within(cards[0]).getByText('Outlook · send_email')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Sends e-mail to people inside and outside EPAM')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Sends messages')).toBeInTheDocument();
    expect(within(cards[1]).getByText('Deletes data')).toBeInTheDocument();
    // A tool without a badge from the server gets the default badge
    expect(within(cards[2]).getByText('Needs approval')).toBeInTheDocument();
  });

  it('shows a personal credential as a card with the person badge', () => {
    setup();

    const card = screen.getAllByTestId('risk-tool-card')[3];
    expect(within(card).getByText('GitHub · personal credential')).toBeInTheDocument();
    expect(within(card).getByText("Runs with the owner's personal GitHub credential.")).toBeInTheDocument();
    expect(within(card).getByText('Personal credential')).toBeInTheDocument();
    expect(within(card).getByTestId('risk-badge-icon-personal_credential')).toBeInTheDocument();
  });

  it('shows the server text of a name mismatch at the typed-name field', () => {
    setup({ nameError: 'Type the schedule name exactly to confirm "Run without asking"' });
    pickRunWithoutAsking();
    typeName('Daily digest');

    expect(
      screen.getByText('Type the schedule name exactly to confirm "Run without asking"'),
    ).toBeInTheDocument();
  });

  it('selects Pause and ask me by default, focuses it and confirms it without a name', () => {
    const { onConfirm } = setup();

    const pause = screen.getByRole('radio', { name: /Pause and ask me/ });
    expect(pause).toBeChecked();
    expect(pause).toHaveFocus();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Type the schedule name/)).not.toBeInTheDocument();

    fireEvent.click(confirmButton());

    expect(onConfirm).toHaveBeenCalledWith({ rule: 'pause_and_ask' });
  });

  it.each([
    ['pause_and_ask', 0],
    ['run_without_asking', 1],
  ])('shows the same info text for %s as the schedule page', async (value, index) => {
    setup();

    const icons = screen.getAllByRole('button', { name: 'More info' });
    expect(icons).toHaveLength(2);
    act(() => icons[index].focus());

    expect(await screen.findByText(APPROVAL_RULE_INFO[value])).toBeInTheDocument();
  });

  it('Run without asking shows the warning and keeps Confirm disabled until the name matches', () => {
    const { onConfirm } = setup();

    pickRunWithoutAsking();

    expect(screen.getByText(/You are responsible for what these tools do/)).toBeInTheDocument();
    expect(screen.getByText('Daily digest')).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
    expect(screen.queryByText('The name does not match yet.')).not.toBeInTheDocument();

    typeName('Daily dig');
    expect(screen.getByText('The name does not match yet.')).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();

    // Case sensitive
    typeName('daily digest');
    expect(confirmButton()).toBeDisabled();

    // Trimmed
    typeName('  Daily digest ');
    expect(screen.queryByText('The name does not match yet.')).not.toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();

    fireEvent.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith({ rule: 'run_without_asking', confirmedName: 'Daily digest' });
  });

  it('going back to Pause and ask me enables Confirm again', () => {
    setup();
    pickRunWithoutAsking();
    expect(confirmButton()).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: /Pause and ask me/ }));

    expect(confirmButton()).toBeEnabled();
  });

  it('disables Run without asking with the project hint when the project does not allow it', () => {
    setup({ runWithoutAskingAllowed: false });

    expect(screen.getByRole('radio', { name: /Run without asking/ })).toBeDisabled();
    expect(screen.getByText('This project does not allow running without asking.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open Project General' })).not.toBeInTheDocument();
  });

  it('disables Run without asking when the risk check sends no allowed flag', () => {
    setup({ runWithoutAskingAllowed: undefined });

    expect(screen.getByRole('radio', { name: /Run without asking/ })).toBeDisabled();
  });

  it('gives an admin the link to Project General', () => {
    setup({ runWithoutAskingAllowed: false, showSettingsLink: true });

    expect(screen.getByRole('link', { name: 'Open Project General' })).toHaveAttribute(
      'href',
      '/settings/project-general',
    );
  });

  it('refuses Run without asking with a note when the scan did not finish', () => {
    setup({ scanIncomplete: true });

    expect(screen.getByRole('radio', { name: /Run without asking/ })).toBeDisabled();
    expect(screen.getByText(/could not list all tools/)).toBeInTheDocument();
  });

  it('shows the info banner when the tools changed', () => {
    setup({ changed: true });

    expect(screen.getByText('The tools changed. Review them again.')).toBeInTheDocument();
  });

  it('Cancel closes the dialog without a confirm', () => {
    const { onCancel, onConfirm } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Escape closes the dialog without a confirm', () => {
    const { onCancel, onConfirm } = setup();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables both buttons while saving', () => {
    setup({ saving: true });

    expect(confirmButton()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
