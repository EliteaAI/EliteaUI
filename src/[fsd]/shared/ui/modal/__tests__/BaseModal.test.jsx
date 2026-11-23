// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import BaseModal from '../BaseModal';

const theme = createTheme(getDesignTokens('dark'));

const renderModal = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <BaseModal
        open
        title="Edit with AI"
        content={<div data-testid="modal-content" />}
        data-testid="base-modal"
        closeButtonTestId="base-modal-close"
        {...props}
      />
    </ThemeProvider>,
  );

const clickBackdrop = () => {
  const backdrop = document.querySelector('.MuiBackdrop-root');
  fireEvent.mouseDown(backdrop);
  fireEvent.click(backdrop);
};

describe('BaseModal', () => {
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('closes on a click outside by default', () => {
    renderModal({ onClose });
    clickBackdrop();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open on a click outside with disableBackdropClose', () => {
    renderModal({ onClose, disableBackdropClose: true });
    clickBackdrop();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('still closes with Escape with disableBackdropClose', () => {
    renderModal({ onClose, disableBackdropClose: true });
    fireEvent.keyDown(screen.getByTestId('modal-content'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('still closes with the close button with disableBackdropClose', () => {
    renderModal({ onClose, disableBackdropClose: true });
    fireEvent.click(screen.getByTestId('base-modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
