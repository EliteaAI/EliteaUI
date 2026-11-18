// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ChatHitlActions from '../ChatHitlActions';

const theme = createTheme({ palette: lightPalette });

const changeset = {
  type: 'hitl',
  guardrail_type: 'builder_changeset',
  changeset_id: 'c9',
  summary: 'Delete agent "Old Bot"',
  message: 'Delete agent "Old Bot"',
  diff: [
    { field: 'name', before: 'Old Bot', after: 'Old Bot 2' },
    { field: 'instructions', added_lines: ['Answer in French.'], removed_lines: ['Answer in English.'] },
  ],
  available_actions: ['apply', 'cancel'],
};

const renderCard = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ChatHitlActions
        hitlInterrupt={changeset}
        interruptId="i1"
        toolCallId="t1"
        onHitlResume={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('Elitea Builder Changes card (#7383)', () => {
  afterEach(cleanup);

  it('shows the summary and the diff', () => {
    renderCard();
    expect(screen.getByTestId('builder-changeset-card')).toBeInTheDocument();
    expect(screen.getByText('Delete agent "Old Bot"')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('Old Bot 2')).toBeInTheDocument();
    expect(screen.getByText('+ Answer in French.')).toBeInTheDocument();
    expect(screen.getByText('- Answer in English.')).toBeInTheDocument();
  });

  it('Apply resumes with apply', () => {
    const onHitlResume = vi.fn();
    renderCard({ onHitlResume });
    fireEvent.click(screen.getByTestId('builder-changeset-apply-button'));
    expect(onHitlResume).toHaveBeenCalledWith({ action: 'apply', toolCallId: 't1', interruptId: 'i1' });
  });

  it('Cancel resumes with cancel', () => {
    const onHitlResume = vi.fn();
    renderCard({ onHitlResume });
    fireEvent.click(screen.getByTestId('builder-changeset-cancel-button'));
    expect(onHitlResume).toHaveBeenCalledWith({ action: 'cancel', toolCallId: 't1', interruptId: 'i1' });
  });

  it('buttons are disabled once the card is answered', () => {
    renderCard({ disabled: true });
    expect(screen.getByTestId('builder-changeset-apply-button')).toBeDisabled();
    expect(screen.getByTestId('builder-changeset-cancel-button')).toBeDisabled();
  });
});
