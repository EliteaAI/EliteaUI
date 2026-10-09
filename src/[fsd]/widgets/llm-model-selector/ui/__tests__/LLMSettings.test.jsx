// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { autoModel } from '@/[fsd]/shared/lib/utils';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LLMSettings from '../LLMSettings';

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }),
}));

vi.hoisted(() => {
  vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/');
  // The store's pipeline slice reads localStorage at import time; jsdom exposes none here
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

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

// #6819 — the reasoning control offers only the levels the model row stores.
describe('Reasoning levels from the model row', () => {
  const renderWithModel = (model, llmSettings, onChangeLLMSettings = vi.fn()) =>
    render(
      <ThemeProvider theme={theme}>
        <LLMSettings
          model={model}
          llmSettings={llmSettings}
          onChangeLLMSettings={onChangeLLMSettings}
        />
      </ThemeProvider>,
    );
  const marks = () => screen.getAllByTestId(/^model-settings-reasoning-level-/);
  const expectLabels = labels => {
    const slider = within(screen.getByTestId('model-settings-reasoning-slider'));
    labels.forEach(label => expect(slider.getAllByText(label).length).toBeGreaterThan(0));
  };

  it('keeps Low / Medium / High for a row without stored levels', () => {
    renderWithModel(
      { name: 'gpt-5.4', project_id: 2, supports_reasoning: true },
      { reasoning_effort: 'medium' },
    );
    expect(marks()).toHaveLength(3);
    expectLabels(['Low', 'Medium', 'High']);
    expect(screen.queryByTestId('model-settings-reasoning-helper')).not.toBeInTheDocument();
  });

  it('offers every stored level, Off first, and stores the picked level', async () => {
    const update = vi.fn();
    const onChange = vi.fn(() => update);
    renderWithModel(
      {
        name: 'gpt-5.6-luna',
        project_id: 2,
        supports_reasoning: true,
        supported_efforts: ['none', 'low', 'medium', 'high', 'xhigh'],
        default_effort: 'medium',
      },
      { reasoning_effort: 'medium' },
      onChange,
    );
    expect(marks()).toHaveLength(5);
    expectLabels(['Off', 'Low', 'Medium', 'High', 'Extra high']);

    await userEvent.click(screen.getByTestId('model-settings-reasoning-level-5'));
    expect(onChange).toHaveBeenCalledWith('reasoning_effort');
    expect(update).toHaveBeenLastCalledWith('xhigh');
  });

  it('explains Off, always-on and token-budget models', () => {
    const { unmount } = renderWithModel(
      {
        name: 'gpt-5.6',
        project_id: 2,
        supports_reasoning: true,
        supported_efforts: ['none', 'low'],
        default_effort: 'low',
      },
      { reasoning_effort: 'none' },
    );
    expect(screen.getByTestId('model-settings-reasoning-helper')).toHaveTextContent('Reasoning is off.');
    unmount();

    const fable = renderWithModel(
      {
        name: 'claude-fable-5-1',
        project_id: 2,
        supports_reasoning: true,
        thinking_type: 'always_on',
        supported_efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
        default_effort: 'high',
      },
      {},
    );
    expect(marks()).toHaveLength(5);
    expect(screen.getByTestId('model-settings-reasoning-helper')).toHaveTextContent(
      'This model always thinks.',
    );
    fable.unmount();

    renderWithModel(
      {
        name: 'claude-haiku-4-5',
        project_id: 2,
        supports_reasoning: true,
        thinking_type: 'enabled',
        supported_efforts: ['low', 'medium', 'high'],
        default_effort: 'medium',
      },
      { reasoning_effort: 'low' },
    );
    expect(screen.getByTestId('model-settings-reasoning-helper')).toHaveTextContent('thinking token budget');
  });

  it('warns about a saved level the model no longer offers instead of snapping it', () => {
    renderWithModel(
      {
        name: 'gpt-5.2',
        project_id: 2,
        supports_reasoning: true,
        supported_efforts: ['low', 'medium'],
        default_effort: 'medium',
      },
      { reasoning_effort: 'xhigh' },
    );
    expect(screen.getByTestId('model-settings-reasoning-helper')).toHaveTextContent(
      'The saved level "xhigh" isn\'t offered for this model.',
    );
  });
});

// #6819 review — single-level models and a saved level the model no longer offers.
describe('Single-level models and unsupported saved levels', () => {
  const renderWithModel = (model, llmSettings, onChangeLLMSettings = vi.fn()) =>
    render(
      <ThemeProvider theme={theme}>
        <LLMSettings
          model={model}
          llmSettings={llmSettings}
          onChangeLLMSettings={onChangeLLMSettings}
        />
      </ThemeProvider>,
    );
  const GPT_5_PRO = {
    name: 'gpt-5-pro',
    project_id: 2,
    supports_reasoning: true,
    supported_efforts: ['high'],
    default_effort: 'high',
  };

  it('shows a single-level model read-only instead of a one-mark slider', () => {
    renderWithModel(GPT_5_PRO, { reasoning_effort: 'high' });
    expect(screen.queryByTestId('model-settings-reasoning-slider')).not.toBeInTheDocument();
    expect(screen.getByTestId('model-settings-reasoning-fixed')).toHaveTextContent('High');
    expect(screen.getByTestId('model-settings-reasoning-helper')).toHaveTextContent(
      'This model accepts only High.',
    );
    expect(screen.queryByTestId('model-settings-reasoning-use-level')).not.toBeInTheDocument();
  });

  it('lets a saved level the single-level model rejects be replaced in one click', async () => {
    const update = vi.fn();
    const onChange = vi.fn(() => update);
    renderWithModel(GPT_5_PRO, { reasoning_effort: 'medium' }, onChange);
    expect(screen.getByTestId('model-settings-reasoning-helper')).toHaveTextContent(
      'The saved level "medium" isn\'t offered for this model.',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Use High' }));
    expect(onChange).toHaveBeenCalledWith('reasoning_effort');
    expect(update).toHaveBeenLastCalledWith('high');
  });

  it('offers the model default for an unsupported saved level on a multi-level model', async () => {
    const update = vi.fn();
    const onChange = vi.fn(() => update);
    renderWithModel(
      {
        name: 'gpt-5.2',
        project_id: 2,
        supports_reasoning: true,
        supported_efforts: ['low', 'medium'],
        default_effort: 'medium',
      },
      { reasoning_effort: 'xhigh' },
      onChange,
    );
    expect(screen.getByTestId('model-settings-reasoning-slider')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Use Medium' }));
    expect(update).toHaveBeenLastCalledWith('medium');
  });
});
