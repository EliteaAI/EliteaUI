// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ConversationStarters from '../ConversationStarters';

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

const renderEditor = ({ saved }) =>
  render(
    <ThemeProvider theme={theme}>
      <ToastContext.Provider value={toast}>
        <Formik
          initialValues={{ version_details: { conversation_starters: saved } }}
          initialTouched={{}}
          onSubmit={() => {}}
        >
          <ConversationStarters />
        </Formik>
      </ToastContext.Provider>
    </ThemeProvider>,
  );

const counter = () => screen.getByTestId('agent-conversation-starters-limit-counter');
const addButton = () => screen.getByTestId('agent-conversation-starter-add');

describe('ConversationStarters limit', () => {
  afterEach(cleanup);

  it('shows the counter and allows adding below the limit', () => {
    shared.max = 5;
    renderEditor({ saved: starters(2) });
    expect(counter()).toHaveTextContent('2/5 starters added.');
    expect(counter()).not.toHaveAttribute('data-over-limit');
    expect(addButton()).toBeEnabled();
    fireEvent.click(addButton());
    expect(counter()).toHaveTextContent('2/5 starters added.');
    expect(addButton()).toBeDisabled();
  });

  it('counts a blank row only once it is filled', () => {
    shared.max = 4;
    renderEditor({ saved: [...starters(3), ''] });
    expect(counter()).toHaveTextContent('3/4 starters added.');
    expect(addButton()).toBeDisabled();
    fireEvent.change(screen.getAllByTestId('agent-conversation-starter-input')[3], {
      target: { value: 'Starter 4' },
    });
    expect(counter()).toHaveTextContent('4/4 starters added.');
    expect(addButton()).toBeDisabled();
  });

  it('leaves the over-limit state once starters are cleared down to the limit', () => {
    shared.max = 5;
    renderEditor({ saved: starters(8) });
    for (let i = 0; i < 3; i += 1)
      fireEvent.change(screen.getAllByTestId('agent-conversation-starter-input')[i], {
        target: { value: '' },
      });
    expect(counter()).toHaveTextContent('5/5 starters added.');
    expect(counter()).not.toHaveAttribute('data-over-limit');
    expect(addButton()).toBeDisabled();
  });

  it('shows 0/M on an empty list', () => {
    shared.max = 6;
    renderEditor({ saved: [] });
    expect(counter()).toHaveTextContent('0/6 starters added.');
  });

  it('disables adding at the limit', () => {
    shared.max = 5;
    renderEditor({ saved: starters(5) });
    expect(counter()).toHaveTextContent('5/5 starters added.');
    expect(addButton()).toBeDisabled();
    expect(counter()).not.toHaveAttribute('data-over-limit');
  });

  it('marks a version saved above the limit and keeps edit and delete available', () => {
    shared.max = 5;
    renderEditor({ saved: starters(8) });
    expect(counter()).toHaveTextContent('8/5 starters added.');
    expect(counter()).toHaveAttribute('data-over-limit', 'true');
    expect(addButton()).toBeDisabled();
    expect(screen.getAllByTestId('agent-conversation-starter-delete')).toHaveLength(8);
    expect(screen.getAllByTestId('agent-conversation-starter-input')[0]).toBeEnabled();
  });

  it('leaves the over-limit state once starters are deleted down to the limit', () => {
    shared.max = 5;
    renderEditor({ saved: starters(8) });
    for (let i = 0; i < 3; i += 1)
      fireEvent.click(screen.getAllByTestId('agent-conversation-starter-delete')[0]);
    expect(counter()).toHaveTextContent('5/5 starters added.');
    expect(counter()).not.toHaveAttribute('data-over-limit');
    expect(addButton()).toBeDisabled();
  });

  it('does not let a version saved above the limit grow back after deleting', () => {
    shared.max = 5;
    renderEditor({ saved: starters(8) });
    fireEvent.click(screen.getAllByTestId('agent-conversation-starter-delete')[0]);
    expect(counter()).toHaveTextContent('7/5 starters added.');
    expect(addButton()).toBeDisabled();
  });

  it('follows a raised limit', () => {
    shared.max = 10;
    renderEditor({ saved: starters(8) });
    expect(counter()).toHaveTextContent('8/10 starters added.');
    expect(addButton()).toBeEnabled();
  });
});
