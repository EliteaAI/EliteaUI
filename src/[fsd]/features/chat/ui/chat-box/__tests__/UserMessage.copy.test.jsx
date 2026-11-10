// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import UserMessage from '../UserMessage';

vi.mock('@/[fsd]/features/chat/participants/lib/hooks', () => ({ useParticipantName: () => 'Agent' }));
vi.mock('@/[fsd]/features/chat/ui', () => ({
  ChatButton: { AttachmentButton: () => null },
  InputGuardrailNotice: () => null,
}));
vi.mock('@/components/Chat/CreatedTimeInfo', () => ({ default: () => null }));
vi.mock('@/components/Chat/MessageAttachmentList', () => ({ default: () => null }));
vi.mock('@/components/UserAvatar', () => ({ default: () => null }));
vi.mock('@/hooks/chat/useHighlightUserMessage', () => ({ default: () => ({ highLightMe: false }) }));

const theme = createTheme({ palette: darkPalette });

const renderMessage = props =>
  render(
    <ThemeProvider theme={theme}>
      <UserMessage
        verticalMode
        messageId="m1"
        name="Ann"
        content="Hello"
        message_items={[]}
        {...props}
      />
    </ThemeProvider>,
  );

describe('UserMessage copy actions (#5838)', () => {
  afterEach(() => cleanup());

  it('offers Copy markdown and Copy text, as an answer does', () => {
    const onCopy = vi.fn();
    renderMessage({ onCopy });

    fireEvent.click(screen.getByRole('button', { name: 'Copy markdown' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy text' }));

    expect(onCopy.mock.calls).toEqual([['markdown'], ['text']]);
  });

  it('shows no copy action without a copy handler', () => {
    renderMessage();
    expect(screen.queryByRole('button', { name: 'Copy markdown' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy text' })).not.toBeInTheDocument();
  });
});
