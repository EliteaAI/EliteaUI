// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { state } = vi.hoisted(() => ({ state: { shouldThrow: false } }));

vi.mock('@/components/MermaidCodeBlock', () => ({
  default: () => {
    if (state.shouldThrow) throw new TypeError('diagram blew up');
    return <div data-testid="mermaid-code-block">diagram</div>;
  },
}));
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

describe('CodeBlock mermaid rendering', () => {
  beforeEach(() => {
    state.shouldThrow = false;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the diagram block when it loads and renders normally', async () => {
    renderBlock({ lang: 'mermaid', text: 'graph TD\nA-->B' });

    expect(await screen.findByTestId('mermaid-code-block')).toBeInTheDocument();
    expect(screen.queryByTestId('mermaid-code-block-fallback')).not.toBeInTheDocument();
  });

  it('shows the diagram source when the diagram block throws while rendering', async () => {
    state.shouldThrow = true;
    renderBlock({ lang: 'mermaid', text: 'graph TD\nA-->B' });

    const fallback = await screen.findByTestId('mermaid-code-block-fallback');

    expect(fallback).toHaveTextContent('graph TD');
    expect(screen.getByTestId('sibling')).toBeInTheDocument();
    expect(screen.queryByTestId('mermaid-code-block')).not.toBeInTheDocument();
  });

  it('tries the diagram again when its text changes, as while a response streams in', async () => {
    state.shouldThrow = true;
    const { rerender } = renderBlock({ lang: 'mermaid', text: 'graph TD\nA--' });
    await screen.findByTestId('mermaid-code-block-fallback');

    state.shouldThrow = false;
    rerender(
      <ThemeProvider theme={theme}>
        <CodeBlock markedToken={{ lang: 'mermaid', text: 'graph TD\nA-->B' }} />
      </ThemeProvider>,
    );

    expect(await screen.findByTestId('mermaid-code-block')).toBeInTheDocument();
    expect(screen.queryByTestId('mermaid-code-block-fallback')).not.toBeInTheDocument();
  });

  it('does not wrap other languages in the diagram fallback', () => {
    renderBlock({ lang: 'javascript', text: 'const a = 1;' });

    expect(screen.queryByTestId('mermaid-code-block')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mermaid-code-block-fallback')).not.toBeInTheDocument();
    expect(screen.getByText('const')).toBeInTheDocument();
  });
});
