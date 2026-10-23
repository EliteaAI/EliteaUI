// @vitest-environment jsdom
import { forwardRef, useImperativeHandle } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const yamlDirty = { value: false };
const stopAll = vi.fn();
const onClearChat = vi.fn();

vi.mock('@/pages/Pipelines/useIsPipelineYamlCodeDirty', () => ({
  default: () => yamlDirty.value,
}));

vi.mock('@/common/constants', () => ({
  WELCOME_MESSAGE_ID: 'welcome',
}));

vi.mock('@/[fsd]/features/chat/ui', () => {
  const ChatBox = forwardRef((props, ref) => {
    useImperativeHandle(ref, () => ({ stopAll, onClear: onClearChat }));
    return (
      <div
        data-testid="chat-box"
        data-send-blocked-reason={props.sendBlockedReason}
      />
    );
  });
  ChatBox.displayName = 'ChatBoxMock';
  return { ChatBox };
});

vi.mock('../TestPanelControls', () => ({
  default: ({ onClear, onClose, isClearDisabled }) => (
    <div>
      <button
        data-testid="clear"
        disabled={isClearDisabled}
        onClick={onClear}
      />
      <button
        data-testid="close"
        onClick={onClose}
      />
    </div>
  ),
}));

const { default: TestPanel } = await import('../TestPanel');
const { UNSAVED_CHANGES_HINT } = await import('../../lib/constants/testPanel.constants');

const theme = createTheme({ palette: darkPalette });

const renderPanel = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <TestPanel
        isOpen
        width={373}
        settings={{ isStreaming: false, activeConversation: { chat_history: [{ id: 1 }] } }}
        onClose={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('TestPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    yamlDirty.value = false;
  });
  afterEach(() => cleanup());

  it('stays mounted but hidden while closed, so the conversation is kept', () => {
    renderPanel({ isOpen: false });

    expect(screen.getByTestId('pipeline-test-panel')).not.toBeVisible();
    expect(screen.getByTestId('chat-box')).toBeInTheDocument();
  });

  it('blocks sending with a save hint while the pipeline has unsaved changes', () => {
    renderPanel();
    expect(screen.getByTestId('chat-box')).toHaveAttribute('data-send-blocked-reason', '');

    cleanup();
    yamlDirty.value = true;
    renderPanel();
    expect(screen.getByTestId('chat-box')).toHaveAttribute('data-send-blocked-reason', UNSAVED_CHANGES_HINT);
  });

  it('stops runs in progress before clearing', () => {
    const editorPanelRef = { current: { hasRunsInProgress: () => true } };
    renderPanel({ editorPanelRef });

    fireEvent.click(screen.getByTestId('clear'));
    expect(stopAll).toHaveBeenCalledTimes(1);
    expect(onClearChat).toHaveBeenCalledTimes(1);
  });

  it('only clears when nothing is running', () => {
    const editorPanelRef = { current: { hasRunsInProgress: () => false } };
    renderPanel({ editorPanelRef });

    fireEvent.click(screen.getByTestId('clear'));
    expect(stopAll).not.toHaveBeenCalled();
    expect(onClearChat).toHaveBeenCalledTimes(1);
  });

  it('disables Clear for an empty or streaming conversation', () => {
    renderPanel({ settings: { isStreaming: false, activeConversation: { chat_history: [] } } });
    expect(screen.getByTestId('clear')).toBeDisabled();

    cleanup();
    renderPanel({ settings: { isStreaming: true, activeConversation: { chat_history: [{ id: 1 }] } } });
    expect(screen.getByTestId('clear')).toBeDisabled();
  });
});
