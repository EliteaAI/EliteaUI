// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ChatModelButton from '../ChatModelButton';

vi.mock('../LLMModelsMenu', () => ({
  default: ({ anchorEl, models, onSelectModel, onClose }) =>
    anchorEl ? (
      <div data-testid="models-menu">
        {models.map(model => (
          <button
            key={model.name}
            onClick={() => {
              onSelectModel(model);
              onClose();
            }}
          >
            {`pick ${model.name}`}
          </button>
        ))}
      </div>
    ) : null,
}));
vi.mock('../LLMSettingsDialog', () => ({
  default: ({ open, onApply, onCancel, llmSettings }) =>
    open ? (
      <div data-testid="settings-dialog">
        <span data-testid="dialog-max-tokens">{llmSettings.max_tokens}</span>
        <button onClick={() => onApply({ max_tokens: 99 })}>apply</button>
        <button onClick={onCancel}>cancel</button>
      </div>
    ) : null,
}));
vi.mock('@/assets/share-icon.svg?react', () => ({ default: () => <span data-testid="shared-model-icon" /> }));
vi.mock('@/components/Icons/BriefcaseIcon.jsx', () => ({
  default: () => <span data-testid="own-model-icon" />,
}));

const theme = createTheme(getDesignTokens('dark'));
const GPT5 = { name: 'gpt-5', display_name: 'GPT-5', shared: true };
const MINI = { name: 'gpt-5-mini', shared: false };

const renderButton = props =>
  render(
    <ThemeProvider theme={theme}>
      <ChatModelButton
        selectedModel={GPT5}
        models={[GPT5, MINI]}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ChatModelButton', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the model name and the shared icon', () => {
    renderButton();

    expect(screen.getByTestId('model-selector-name')).toHaveTextContent('GPT-5');
    expect(screen.getByTestId('shared-model-icon')).toBeInTheDocument();
  });

  it('shows the own-model icon and falls back to the name', () => {
    renderButton({ selectedModel: MINI });

    expect(screen.getByTestId('model-selector-name')).toHaveTextContent('gpt-5-mini');
    expect(screen.getByTestId('own-model-icon')).toBeInTheDocument();
  });

  it('says None without a model', () => {
    renderButton({ selectedModel: undefined });

    expect(screen.getByTestId('model-selector-name')).toHaveTextContent('None');
  });

  it('opens the model list and picks a model', () => {
    const onSelectModel = vi.fn();
    renderButton({ onSelectModel });

    const button = screen.getByTestId('model-selector-name');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByText('pick gpt-5-mini'));
    expect(onSelectModel).toHaveBeenCalledWith(MINI);
    expect(screen.queryByTestId('models-menu')).not.toBeInTheDocument();
  });

  it('opens no list while disabled', () => {
    renderButton({ disabled: true });

    fireEvent.click(screen.getByTestId('model-selector-name'));

    expect(screen.queryByTestId('models-menu')).not.toBeInTheDocument();
  });

  it('opens the settings dialog and applies the settings', () => {
    const onSetLLMSettings = vi.fn();
    renderButton({ onSetLLMSettings, llmSettings: { max_tokens: 512 } });

    fireEvent.click(screen.getByTestId('model-settings-button'));
    expect(screen.getByTestId('dialog-max-tokens')).toHaveTextContent('512');

    fireEvent.click(screen.getByText('apply'));
    expect(onSetLLMSettings).toHaveBeenCalledWith({ max_tokens: 99 });
    expect(screen.queryByTestId('settings-dialog')).not.toBeInTheDocument();
  });

  it('keeps the settings enabled while the model list is disabled (an answer streams)', () => {
    renderButton({ disabled: true, onSetLLMSettings: vi.fn() });

    expect(screen.getByTestId('model-settings-button')).toBeEnabled();
  });

  it('disables and dims the settings without a settings handler', () => {
    renderButton();

    const gear = screen.getByTestId('model-settings-button');
    expect(gear).toBeDisabled();
    expect(gear.querySelector('path')).toHaveAttribute('fill', theme.palette.icon.disabled);
  });

  it('marks both buttons for the chat tour', () => {
    renderButton({ dataTourTargetId: 'chat-model-settings' });

    const group = screen.getByTestId('model-selector-button');
    expect(group).toHaveAttribute('data-tour', 'chat-model-settings');
    expect(group).toContainElement(screen.getByTestId('model-settings-button'));
  });
});
