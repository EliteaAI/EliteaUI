// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import UserInteractionStep from '../UserInteractionStep';

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

const renderStep = ({ current = [], suggested, onDraftChange = vi.fn() }) =>
  render(
    <ThemeProvider theme={theme}>
      <ToastContext.Provider value={toast}>
        <UserInteractionStep
          currentData={{ version_details: { conversation_starters: current } }}
          draftData={{ conversation_starters: suggested }}
          onDraftChange={onDraftChange}
          fieldApplyFlags={{ welcome_message: true, conversation_starters: true }}
          onToggleField={vi.fn()}
        />
      </ToastContext.Provider>
    </ThemeProvider>,
  );

const counter = () => screen.getByTestId('ai-edit-agent-starters-limit-counter');
const addButton = () => screen.getByTestId('ai-edit-agent-starter-add');

describe('UserInteractionStep chat starters limit', () => {
  afterEach(() => cleanup());

  it('counts suggested starters against the limit and allows adding below it', () => {
    shared.max = 5;
    const onDraftChange = vi.fn();
    renderStep({ suggested: starters(3), onDraftChange });
    expect(counter()).toHaveTextContent('3/5 added.');
    expect(counter()).not.toHaveAttribute('data-over-limit');
    fireEvent.click(addButton());
    expect(onDraftChange).toHaveBeenCalledWith({ conversation_starters: [...starters(3), ''] });
  });

  it('disables adding at the limit', () => {
    shared.max = 5;
    renderStep({ suggested: starters(5) });
    expect(counter()).toHaveTextContent('5/5 added.');
    expect(addButton()).toBeDisabled();
  });

  it('disables adding while a suggested starter is blank', () => {
    shared.max = 5;
    renderStep({ suggested: ['Starter 1', ''] });
    expect(addButton()).toBeDisabled();
  });

  it('marks a list above the limit as over limit, even when the version already held that many', () => {
    shared.max = 4;
    renderStep({ current: starters(6), suggested: starters(6) });
    expect(counter()).toHaveTextContent('6/4 added.');
    expect(counter()).toHaveAttribute('data-over-limit', 'true');
    expect(addButton()).toBeDisabled();
  });
});
