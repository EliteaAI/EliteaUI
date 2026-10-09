import { marked } from 'marked';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import Token from '../Token';

vi.mock('@/components/CodeBlock', () => ({ default: () => null }));
vi.mock('@/components/MarkdownTableBlock', () => ({ default: () => null }));

describe('Token ordered-list rendering', () => {
  it('preserves the source start number for a continued list', () => {
    const markedToken = marked.lexer('100. item-100\n101. item-101\n')[0];
    const theme = createTheme({
      palette: {
        border: { lines: '#000' },
        text: { highlighted: '#000' },
      },
    });

    const rendered = renderToStaticMarkup(
      <ThemeProvider theme={theme}>
        <Token
          markedToken={markedToken}
          renderHtml
        />
      </ThemeProvider>,
    );

    expect(rendered).toMatch(/<ol[^>]*start="100"/);
    expect(rendered).toContain('item-100');
    expect(rendered).toContain('item-101');
  });
});

describe('Token link rendering', () => {
  const theme = createTheme({
    palette: {
      border: { lines: '#000' },
      text: { highlighted: '#000' },
    },
  });

  const renderMarkdown = source =>
    renderToStaticMarkup(
      <ThemeProvider theme={theme}>
        <Token
          markedToken={marked.lexer(source)[0]}
          renderHtml
        />
      </ThemeProvider>,
    );

  it('rewrites artifact storage path links to the Artifacts viewer URL', () => {
    const rendered = renderMarkdown('[file](/architecture/architecture/elitea-mcp-architecture.html)');

    expect(rendered).toContain(
      'href="/artifacts?bucket=architecture&amp;file=architecture%2Felitea-mcp-architecture.html"',
    );
  });

  it('keeps external links unchanged', () => {
    const rendered = renderMarkdown('[site](https://example.com/bucket/file.html)');

    expect(rendered).toContain('href="https://example.com/bucket/file.html"');
  });
});
