// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import InputGuardrailNotice from '../InputGuardrailNotice';

vi.mock('@/assets/attention-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/assets/error-icon.svg?react', () => ({ default: () => null }));

const theme = createTheme({
  palette: {
    alert: {
      error: { background: '#000', border: '#000', text: '#000' },
      warning: { background: '#000', border: '#000' },
    },
    icon: { error: '#000', warning: '#000' },
    status: { warningText: '#000' },
  },
});

const renderNotice = guardrail =>
  render(
    <ThemeProvider theme={theme}>
      <InputGuardrailNotice guardrail={guardrail} />
    </ThemeProvider>,
  );

describe('InputGuardrailNotice', () => {
  afterEach(() => cleanup());

  it('explains a credential block by its message key', () => {
    renderNotice({
      action: 'block',
      message_key: 'input_guardrail.blocked.credentials',
      message: 'server text',
    });
    expect(screen.getByTestId('input-guardrail-blocked')).toHaveTextContent(
      'appears to contain a credential',
    );
  });

  it('sends an instructions block to the agent owner, not the user', () => {
    renderNotice({
      action: 'block',
      message_key: 'input_guardrail.blocked.instructions',
      message: 'server text',
    });
    expect(screen.getByTestId('input-guardrail-blocked')).toHaveTextContent("Ask the agent's owner");
  });

  it('falls back to the server message for an unknown key', () => {
    renderNotice({ action: 'block', message_key: 'input_guardrail.blocked.future', message: 'server text' });
    expect(screen.getByTestId('input-guardrail-blocked')).toHaveTextContent('server text');
  });

  it('shows a quieter notice for a redaction', () => {
    renderNotice({ action: 'redact' });
    expect(screen.getByTestId('input-guardrail-notice')).toHaveTextContent('masked');
  });

  it('renders nothing for a silent record or no verdict', () => {
    const { container } = renderNotice({ action: 'record' });
    expect(container).toBeEmptyDOMElement();
    cleanup();
    expect(renderNotice(undefined).container).toBeEmptyDOMElement();
  });
});
