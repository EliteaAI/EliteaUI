// @vitest-environment jsdom
import { marked } from 'marked';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import Token from '../Token';
import UntrustedMarkdownBoundary from '../UntrustedMarkdownBoundary';

vi.mock('@/[fsd]/shared/ui/code-block', () => ({ default: () => null }));
vi.mock('@/components/MarkdownTableBlock', () => ({ default: () => null }));

describe('UntrustedMarkdownBoundary', () => {
  const theme = createTheme({ palette: { border: { lines: '#000' }, text: { highlighted: '#000' } } });
  const render = (source, wrap) => {
    const body = (
      <ThemeProvider theme={theme}>
        {marked.lexer(source).map((t, i) => (
          <Token
            key={i}
            markedToken={t}
            renderHtml
          />
        ))}
      </ThemeProvider>
    );
    return renderToStaticMarkup(wrap ? <UntrustedMarkdownBoundary>{body}</UntrustedMarkdownBoundary> : body);
  };

  // Goodreads shape: a cover image wrapped in a root-relative link to the book page.
  const source = '[![cover](https://i.example.com/c.jpg)](/book/show/1-dune) [ok](https://example.com/x)';

  it('replaces images with a link to the real image URL and keeps relative links out of artifacts', () => {
    const out = render(source, true);
    expect(out).not.toContain('<img');
    expect(out).toContain('[Image: cover]');
    expect(out).toContain('title="https://i.example.com/c.jpg"');
    expect(out).not.toContain('artifacts?');
    expect(out).toContain('href="https://example.com/x"');
  });

  it('renders images normally outside the boundary', () => {
    expect(render(source, false)).toContain('<img');
  });

  it('still rewrites artifact-shaped links outside the boundary', () => {
    expect(render(source, false)).toContain('artifacts?');
  });

  it('strips raw HTML <img> tags so they cannot be fetched', () => {
    const out = render('<img src="https://tracker.example/p.gif">', true);
    expect(out).not.toContain('<img');
    expect(out).not.toContain('tracker.example');
  });
});

describe('UntrustedMarkdownBoundary remote-fetch vectors', () => {
  const theme = createTheme({ palette: { border: { lines: '#000' }, text: { highlighted: '#000' } } });
  const render = html =>
    renderToStaticMarkup(
      <UntrustedMarkdownBoundary>
        <ThemeProvider theme={theme}>
          {marked.lexer(html).map((t, i) => (
            <Token
              key={i}
              markedToken={t}
              renderHtml
            />
          ))}
        </ThemeProvider>
      </UntrustedMarkdownBoundary>,
    );

  it.each([
    ['picture/source srcset', '<picture><source srcset="https://t.example/a.jpg"><p>x</p></picture>'],
    ['video poster', '<video poster="https://t.example/a.jpg"></video>'],
    ['audio', '<audio src="https://t.example/a.mp3"></audio>'],
    ['input type=image', '<input type="image" src="https://t.example/a.jpg">'],
    ['inline style url()', '<p style="background:url(https://t.example/a.jpg)">x</p>'],
    ['background attribute', '<table background="https://t.example/a.jpg"><tr><td>x</td></tr></table>'],
  ])('does not emit a remote fetch for %s', (_name, html) => {
    expect(render(html)).not.toContain('t.example');
  });
});

describe('Token outside the untrusted boundary', () => {
  it('still renders model-authored images as <img>', () => {
    const theme = createTheme({ palette: { border: { lines: '#000' }, text: { highlighted: '#000' } } });
    const out = renderToStaticMarkup(
      <ThemeProvider theme={theme}>
        <Token
          markedToken={marked.lexer('![chart](https://example.com/chart.png)')[0]}
          renderHtml
        />
      </ThemeProvider>,
    );
    expect(out).toContain('<img');
  });
});
