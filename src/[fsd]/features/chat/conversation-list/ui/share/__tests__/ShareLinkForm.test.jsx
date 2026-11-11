// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { DEFAULT_LINK_FORM, WHICH_MESSAGES } from '../../../lib/constants/shareChat.constants';
import ShareLinkForm from '../ShareLinkForm';

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }),
}));
vi.mock('../../../lib/hooks/useCopyToClipboard.hooks', () => ({ useCopyToClipboard: () => vi.fn() }));

// The message list loads more on scroll; jsdom has no IntersectionObserver
vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    disconnect() {}
  },
);

const theme = createTheme(getDesignTokens('dark'));

const renderForm = props =>
  render(
    <ThemeProvider theme={theme}>
      <ShareLinkForm
        form={DEFAULT_LINK_FORM}
        messages={[]}
        messagesTotal={3}
        totalFiles={0}
        isFilesLoaded
        isMessagesFetching={false}
        onLoadMoreMessages={vi.fn()}
        onChange={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

const attachments = () => screen.getByRole('checkbox', { name: /Attachments/ });

describe('ShareLinkForm Attachments', () => {
  afterEach(() => cleanup());

  it('is disabled and unticked when the chat has no files', () => {
    renderForm();
    expect(attachments()).toBeDisabled();
    expect(attachments()).not.toBeChecked();
  });

  it('stays unticked for selected messages in a chat with no files', () => {
    renderForm({ form: { ...DEFAULT_LINK_FORM, whichMessages: WHICH_MESSAGES.selected } });
    expect(attachments()).toBeDisabled();
    expect(attachments()).not.toBeChecked();
  });

  it('can be ticked when the chat has files', () => {
    renderForm({ totalFiles: 2 });
    expect(attachments()).toBeEnabled();
    expect(attachments()).toBeChecked();
  });

  it('can be ticked until the number of files has loaded', () => {
    renderForm({ isFilesLoaded: false });
    expect(attachments()).toBeEnabled();
  });
});
