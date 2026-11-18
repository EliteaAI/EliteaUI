// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SummaryStep from '../SummaryStep';

const shared = vi.hoisted(() => ({ max: 5 }));

vi.mock('@/[fsd]/features/agent/lib/hooks', () =>
  vi.importActual('@/[fsd]/features/agent/lib/hooks/useConversationStartersAddGate.hooks'),
);
vi.mock('@/[fsd]/features/agent/lib/hooks/useConversationStartersLimit.hooks', () => ({
  useConversationStartersLimit: () => shared.max,
}));

const theme = createTheme(getDesignTokens('dark'));
const noop = () => {};
const toast = {
  toastHandlers: { toastError: noop, toastSuccess: noop, toastInfo: noop, toastWarning: noop },
  clearToast: noop,
  setTopPosition: noop,
  setIcon: noop,
  setOnCloseToast: noop,
};
const starters = n => Array.from({ length: n }, (_, i) => `Starter ${i + 1}`);
const flags = applyStarters => ({
  name: false,
  description: false,
  instructions: false,
  welcome_message: false,
  conversation_starters: applyStarters,
});

const renderStep = ({ current = [], suggested = [], applyStarters = true, onDraftChange = vi.fn() }) =>
  render(
    <ThemeProvider theme={theme}>
      <ToastContext.Provider value={toast}>
        <SummaryStep
          currentData={{ name: 'Agent', version_details: { conversation_starters: current } }}
          draftData={{ conversation_starters: suggested }}
          onDraftChange={onDraftChange}
          fieldApplyFlags={flags(applyStarters)}
          onToggleField={vi.fn()}
          toolSelections={{}}
          onValidationChange={vi.fn()}
        />
      </ToastContext.Provider>
    </ThemeProvider>,
  );

const counter = () => screen.getByTestId('ai-edit-agent-summary-starters-limit-counter');
const addButton = () => screen.getByTestId('ai-edit-agent-summary-starter-add');

describe('SummaryStep chat starters limit', () => {
  afterEach(() => cleanup());

  it('counts the applied suggestions against the limit and allows adding below it', () => {
    shared.max = 5;
    const onDraftChange = vi.fn();
    renderStep({ suggested: starters(2), onDraftChange });
    expect(counter()).toHaveTextContent('2/5 added.');
    fireEvent.click(addButton());
    expect(onDraftChange).toHaveBeenCalledWith(
      expect.objectContaining({ conversation_starters: [...starters(2), ''] }),
    );
  });

  it('counts the current starters when the suggestions are not applied', () => {
    shared.max = 5;
    renderStep({ current: starters(5), suggested: starters(1), applyStarters: false });
    expect(counter()).toHaveTextContent('5/5 added.');
    expect(addButton()).toBeDisabled();
  });

  it('marks a version saved above the limit as over limit and blocks adding', () => {
    shared.max = 4;
    renderStep({ current: starters(7), applyStarters: false });
    expect(counter()).toHaveTextContent('7/4 added.');
    expect(counter()).toHaveAttribute('data-over-limit', 'true');
    expect(addButton()).toBeDisabled();
  });
});
