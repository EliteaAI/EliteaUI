// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

// The diagram chunk cannot be fetched, as after a deployment replaced the hashed asset
vi.mock('@/components/MermaidCodeBlock', () => {
  throw new Error('Failed to fetch dynamically imported module: https://example.com/MermaidCodeBlock-abc.js');
});
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useCheckIsBlockEditing: () => ({ isBlockEditing: false, blockId: 'block' }),
  useToast: () => ({ toastInfo: vi.fn() }),
}));
vi.mock('@/components/MarkdownTableBlock', () => ({ useShouldDisableEditCanvas: () => false }));
vi.mock('@/hooks/chat/useCopyEventHandlers', () => ({
  default: () => ({ onClickCopy: vi.fn(), onClickDownload: vi.fn() }),
}));

const { default: CodeBlock } = await import('../CodeBlock');

const theme = createTheme({ palette: lightPalette });

const renderBlock = markedToken =>
  render(
    <ThemeProvider theme={theme}>
      <div data-testid="sibling">rest of the chat</div>
      <CodeBlock markedToken={markedToken} />
    </ThemeProvider>,
  );

describe('CodeBlock when the mermaid chunk fails to load', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the diagram source instead of crashing the surrounding content', async () => {
    renderBlock({ lang: 'mermaid', text: 'graph TD\nA-->B' });

    const fallback = await screen.findByTestId('mermaid-code-block-fallback');

    expect(fallback).toHaveTextContent('The diagram could not be displayed');
    expect(fallback).toHaveTextContent('graph TD');
    expect(fallback).toHaveTextContent('A-->B');
    expect(screen.getByTestId('sibling')).toBeInTheDocument();
  });
});
