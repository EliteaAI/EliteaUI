import { marked } from 'marked';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import Token from './Token';

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
