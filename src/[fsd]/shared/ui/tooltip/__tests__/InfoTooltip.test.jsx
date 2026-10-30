// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Box, Dialog, ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import InfoTooltip from '../InfoTooltip';

vi.mock('@/components/Icons/InfoIcon', () => ({
  default: () => <svg data-testid="info-icon" />,
}));

vi.mock('@/[fsd]/shared/ui/tooltip/TooltipMarkdownContent', () => ({
  default: ({ children }) => <span>{children}</span>,
}));

const TEXT = 'Unique name of this node.';

const theme = createTheme();

const renderTooltip = (props = {}, onParentClick = vi.fn()) =>
  render(
    <ThemeProvider theme={theme}>
      <Box
        data-testid="parent"
        onClick={onParentClick}
      >
        <InfoTooltip
          infoTooltip={TEXT}
          testId="info"
          contentTestId="info-content"
          {...props}
        />
      </Box>
      <Box data-testid="outside">outside</Box>
    </ThemeProvider>,
  );

describe('InfoTooltip', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the text on hover and stays a plain icon without pinnable', async () => {
    renderTooltip();
    const icon = screen.getByTestId('info');

    expect(icon).not.toHaveAttribute('tabindex');
    expect(icon).not.toHaveAttribute('role');

    fireEvent.mouseOver(icon);
    expect(await screen.findByTestId('info-content')).toHaveTextContent(TEXT);
  });

  describe('pinnable', () => {
    it('is focusable and opens on focus with aria-describedby', async () => {
      renderTooltip({ pinnable: true });
      const icon = screen.getByTestId('info');

      expect(icon).toHaveAttribute('tabindex', '0');
      expect(icon).toHaveAttribute('role', 'button');

      fireEvent.focus(icon);
      const content = await screen.findByTestId('info-content');
      expect(content).toHaveTextContent(TEXT);
      expect(icon).toHaveAttribute('aria-describedby');
    });

    it('stays open after mouse leave when pinned by click, and the click does not reach the parent', async () => {
      const onParentClick = vi.fn();
      renderTooltip({ pinnable: true }, onParentClick);
      const icon = screen.getByTestId('info');

      fireEvent.mouseEnter(icon);
      fireEvent.click(icon);
      fireEvent.mouseLeave(icon);

      expect(await screen.findByTestId('info-content')).toBeInTheDocument();
      expect(onParentClick).not.toHaveBeenCalled();
    });

    it('pins with Enter on the focused icon and closes with Escape while still focused', async () => {
      renderTooltip({ pinnable: true });
      const icon = screen.getByTestId('info');

      fireEvent.focus(icon);
      fireEvent.keyDown(icon, { key: 'Enter' });
      expect(await screen.findByTestId('info-content')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      await vi.waitFor(() => expect(screen.queryByTestId('info-content')).not.toBeInTheDocument());
    });

    it('closes with Escape when opened by focus only', async () => {
      renderTooltip({ pinnable: true });
      const icon = screen.getByTestId('info');

      fireEvent.focus(icon);
      expect(await screen.findByTestId('info-content')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      await vi.waitFor(() => expect(screen.queryByTestId('info-content')).not.toBeInTheDocument());
    });

    it('closes on a second click while the icon is still hovered and focused', async () => {
      renderTooltip({ pinnable: true });
      const icon = screen.getByTestId('info');

      fireEvent.mouseEnter(icon);
      fireEvent.focus(icon);
      fireEvent.click(icon);
      expect(await screen.findByTestId('info-content')).toBeInTheDocument();

      fireEvent.click(icon);
      await vi.waitFor(() => expect(screen.queryByTestId('info-content')).not.toBeInTheDocument());
    });

    it('stops Escape before other document handlers while open', async () => {
      const onDocumentKeyDown = vi.fn();
      document.addEventListener('keydown', onDocumentKeyDown);
      renderTooltip({ pinnable: true });

      fireEvent.focus(screen.getByTestId('info'));
      expect(await screen.findByTestId('info-content')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onDocumentKeyDown).not.toHaveBeenCalled();
      document.removeEventListener('keydown', onDocumentKeyDown);
    });

    it('keeps a MUI Dialog open on the first Escape and closes the tooltip', async () => {
      const onClose = vi.fn();
      render(
        <ThemeProvider theme={theme}>
          <Dialog
            open
            onClose={onClose}
          >
            <InfoTooltip
              infoTooltip={TEXT}
              testId="info"
              contentTestId="info-content"
              pinnable
            />
          </Dialog>
        </ThemeProvider>,
      );
      const icon = screen.getByTestId('info');

      fireEvent.focus(icon);
      expect(await screen.findByTestId('info-content')).toBeInTheDocument();
      fireEvent.keyDown(icon, { key: 'Escape' });

      await vi.waitFor(() => expect(screen.queryByTestId('info-content')).not.toBeInTheDocument());
      expect(onClose).not.toHaveBeenCalled();
    });

    it('uses the label prop as the name of the icon and defaults to More info', () => {
      const { rerender } = renderTooltip({ pinnable: true });
      expect(screen.getByTestId('info')).toHaveAttribute('aria-label', 'More info');

      rerender(
        <ThemeProvider theme={theme}>
          <InfoTooltip
            infoTooltip={TEXT}
            testId="info"
            label="More info about Pause and ask me"
            pinnable
          />
        </ThemeProvider>,
      );
      expect(screen.getByTestId('info')).toHaveAttribute('aria-label', 'More info about Pause and ask me');
    });

    it('closes on a click outside', async () => {
      renderTooltip({ pinnable: true });
      const icon = screen.getByTestId('info');

      fireEvent.click(icon);
      expect(await screen.findByTestId('info-content')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('outside'));
      await vi.waitFor(() => expect(screen.queryByTestId('info-content')).not.toBeInTheDocument());
    });
  });
});
