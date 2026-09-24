// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { autoModel } from '@/[fsd]/shared/lib/utils';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LLMSettings from '../LLMSettings';

vi.mock('@/hooks/useToast', () => ({ default: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }) }));

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const theme = createTheme({ palette: lightPalette });
const renderSettings = (llmSettings, onChangeLLMSettings = vi.fn()) =>
  render(
    <ThemeProvider theme={theme}>
      <LLMSettings
        model={autoModel()}
        llmSettings={llmSettings}
        onChangeLLMSettings={onChangeLLMSettings}
      />
    </ThemeProvider>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('Auto reasoning settings', () => {
  it.each([undefined, null, {}])('renders saved Auto settings with missing reasoning %s', reasoning => {
    renderSettings({ selection: { mode: 'auto', reasoning }, max_tokens: -1 });
    expect(screen.getByTestId('auto-reasoning-effort')).toHaveValue('auto');
    expect(screen.queryByText('Remaining Tokens')).not.toBeInTheDocument();
  });

  it('preserves the profile and stores explicit reasoning through the shared input', async () => {
    const update = vi.fn();
    const onChange = vi.fn(() => update);
    const selection = autoModel({ id: 'quality-cost', revision: 12 }).selection;
    const { rerender } = renderSettings({ selection, max_tokens: -1 }, onChange);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'High' }));
    expect(onChange).toHaveBeenCalledWith('selection');
    expect(update).toHaveBeenLastCalledWith({
      ...selection,
      reasoning: { mode: 'explicit', preset: 'high' },
    });
    rerender(
      <ThemeProvider theme={theme}>
        <LLMSettings
          model={autoModel()}
          llmSettings={{
            selection: { ...selection, reasoning: { mode: 'explicit', preset: 'high' } },
            max_tokens: -1,
          }}
          onChangeLLMSettings={onChange}
        />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Auto' }));
    expect(update).toHaveBeenLastCalledWith({ ...selection, reasoning: { mode: 'auto' } });
  });
});
