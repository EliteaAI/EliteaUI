// @vitest-environment jsdom
import { marked } from 'marked';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import Token from '../Token';

vi.mock('@/[fsd]/shared/ui/code-block', () => ({ default: () => null }));
vi.mock('@/components/MarkdownTableBlock', () => ({ default: () => null }));

describe('Token raw HTML rendering', () => {
  const theme = createTheme({
    palette: {
      border: { lines: '#000' },
      text: { highlighted: '#000' },
    },
  });

  const renderToBody = source => {
    const markup = marked
      .lexer(source)
      .map(token =>
        renderToStaticMarkup(
          <ThemeProvider theme={theme}>
            <Token
              markedToken={token}
              renderHtml
            />
          </ThemeProvider>,
        ),
      )
      .join('');
    return new DOMParser().parseFromString(markup, 'text/html').body;
  };

  const visibleText = body => body.textContent.replace(/\s+/g, ' ').trim();

  it('keeps the text after an unclosed script tag and shows the tag as text', () => {
    const body = renderToBody('<img src=x onerror=alert(1)>\nwwww\n<script>\nпривет');

    expect(body.textContent).toContain('<script>\nпривет');
    expect(body.querySelector('script')).toBeNull();
    expect(body.querySelector('img').outerHTML).toBe('<img src="x">');
  });

  it('shows a closed script block as text instead of dropping it', () => {
    const body = renderToBody('<script>alert(1)</script>\n');

    expect(body.textContent).toContain('<script>alert(1)</script>');
    expect(body.querySelector('script')).toBeNull();
  });

  it('shows an iframe block as text instead of dropping it', () => {
    const body = renderToBody('<iframe src="https://example.com"></iframe>\nafter');

    expect(visibleText(body)).toBe('<iframe src="https://example.com"></iframe> after');
    expect(body.querySelector('iframe')).toBeNull();
  });

  it('still renders allowed HTML elements', () => {
    const body = renderToBody('<details><summary>More</summary>inner</details>\n');

    expect(body.querySelector('details summary').textContent).toBe('More');
  });

  it.each([
    ['<svg width="16" height="16">\n<title>Close</title>\n<path d="M0 0"/>\n</svg>\n\nnext', 'next'],
    ['<svg>\n<style>.a{fill:red}</style>\n</svg>\n\nnext', 'next'],
    ['Click <svg><title>Close</title></svg> to close', 'Click Close to close'],
    ['<details>\n<summary>Tpl</summary>\n<template><b>x</b></template>\n</details>', 'Tpl'],
  ])('renders %j as %j, without exposing hidden markup', (source, text) => {
    const body = renderToBody(source);

    expect(visibleText(body)).toBe(text);
    expect(body.querySelector('svg, title, style, b')).toBeNull();
  });
});
