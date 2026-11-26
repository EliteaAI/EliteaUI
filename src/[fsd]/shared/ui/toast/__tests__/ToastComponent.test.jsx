// @vitest-environment jsdom
import { useContext } from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import ToastComponent from '../ToastComponent';
import ToastProvider from '../ToastProvider';

vi.mock('@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks', () => ({
  useAllToastDurations: () => ({ error: 60000, warning: 60000, success: 60000, info: 60000 }),
}));

let handlers;

const HandlersProbe = () => {
  handlers = useContext(ToastContext).toastHandlers;
  return null;
};

describe('ToastComponent', () => {
  afterEach(() => cleanup());

  it('lists the toasts from top to bottom in the order they appeared', () => {
    render(
      <ToastProvider>
        <HandlersProbe />
        <ToastComponent />
      </ToastProvider>,
    );

    act(() => {
      handlers.toastInfo('First');
      handlers.toastError('Second');
      handlers.toastSuccess('Third');
    });

    const messages = screen.getAllByTestId('toast-message').map(element => element.textContent);
    expect(messages).toEqual(['First', 'Second', 'Third']);
    expect(screen.getByTestId('toast-stack')).toBeInTheDocument();
  });

  it('adds a later toast below the ones already shown', () => {
    render(
      <ToastProvider>
        <HandlersProbe />
        <ToastComponent />
      </ToastProvider>,
    );

    act(() => handlers.toastInfo('First'));
    act(() => handlers.toastInfo('Second'));

    const messages = screen.getAllByTestId('toast-message').map(element => element.textContent);
    expect(messages).toEqual(['First', 'Second']);
  });

  it('marks a toast as closing in the provider when its close button is clicked', () => {
    let toasts;
    const ToastsProbe = () => {
      toasts = useContext(ToastContext).toasts;
      return null;
    };

    render(
      <ToastProvider>
        <HandlersProbe />
        <ToastsProbe />
        <ToastComponent />
      </ToastProvider>,
    );

    act(() => handlers.toastInfo('First'));
    fireEvent.click(screen.getByTestId('toast-dismiss-button'));

    expect(toasts.map(toast => toast.open)).toEqual([false]);
  });
});
