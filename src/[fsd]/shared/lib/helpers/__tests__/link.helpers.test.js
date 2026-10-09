/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getBasename } from '@/routes';

import { parseArtifactHref, resolveArtifactHref, resolveArtifactHrefsInHtml } from '../link.helpers';

vi.mock('@/routes', () => ({
  default: { Artifacts: '/artifacts' },
  getBasename: vi.fn(() => '/app'),
}));

describe('resolveArtifactHref', () => {
  beforeEach(() => {
    vi.mocked(getBasename).mockReturnValue('/app');
  });

  it('converts an artifact storage path into the Artifacts viewer URL', () => {
    expect(resolveArtifactHref('/architecture/architecture/elitea-mcp-architecture.html')).toBe(
      '/app/artifacts?bucket=architecture&file=architecture%2Felitea-mcp-architecture.html',
    );
  });

  it('handles files in the bucket root', () => {
    expect(resolveArtifactHref('/my-bucket/report.xml')).toBe(
      '/app/artifacts?bucket=my-bucket&file=report.xml',
    );
  });

  it('decodes already encoded segments before re-encoding', () => {
    expect(resolveArtifactHref('/bucket/my%20file.html')).toBe(
      '/app/artifacts?bucket=bucket&file=my%20file.html',
    );
  });

  it('ignores query string and hash', () => {
    expect(resolveArtifactHref('/bucket/dir/file.html?x=1#top')).toBe(
      '/app/artifacts?bucket=bucket&file=dir%2Ffile.html',
    );
  });

  it.each(['sandbox:/attach/generated-demo.html', 'sandbox:attach/generated-demo.html'])(
    'converts %s pseudo-scheme link',
    href => {
      expect(resolveArtifactHref(href)).toBe('/app/artifacts?bucket=attach&file=generated-demo.html');
    },
  );

  it('converts sandbox link whose bucket matches the basename segment', () => {
    expect(resolveArtifactHref('sandbox:/app/file.html')).toBe('/app/artifacts?bucket=app&file=file.html');
  });

  it('works without basename', () => {
    vi.mocked(getBasename).mockReturnValue('');
    expect(resolveArtifactHref('/bucket/file.html')).toBe('/artifacts?bucket=bucket&file=file.html');
  });

  it.each([
    'https://next.elitea.ai/bucket/file.html',
    'mailto:someone@example.com',
    '//cdn.example.com/bucket/file.js',
    '#anchor',
    'relative/path.html',
    '/single-segment',
    'sandbox:/single-segment',
    '/bucket/',
    '/app/32/chat/9582',
    '/app',
    '',
    undefined,
  ])('leaves %s unchanged', href => {
    expect(resolveArtifactHref(href)).toBe(href);
  });
});

describe('resolveArtifactHrefsInHtml', () => {
  beforeEach(() => {
    vi.mocked(getBasename).mockReturnValue('/app');
  });

  it('rewrites artifact links inside HTML', () => {
    const html = '<p><a href="/bucket/dir/file.html">file</a> <a href="https://example.com">ext</a></p>';
    const result = resolveArtifactHrefsInHtml(html);

    expect(result).toContain('href="/app/artifacts?bucket=bucket&amp;file=dir%2Ffile.html"');
    expect(result).toContain('href="https://example.com"');
  });

  it('uses a custom resolver and drops href when it returns null', () => {
    const html = '<a href="/attach/shared.html">a</a> <a href="/attach/other.html">b</a>';
    const result = resolveArtifactHrefsInHtml(html, ({ file }) =>
      file === 'shared.html' ? '/public/x' : null,
    );

    expect(result).toContain('<a href="/public/x">a</a>');
    expect(result).toContain('<a>b</a>');
  });

  it('returns HTML without links as is', () => {
    expect(resolveArtifactHrefsInHtml('<b>bold</b>')).toBe('<b>bold</b>');
  });
});

describe('parseArtifactHref', () => {
  beforeEach(() => {
    vi.mocked(getBasename).mockReturnValue('/app');
  });

  it('returns bucket and file for artifact paths', () => {
    expect(parseArtifactHref('sandbox:/attach/dir/file.html')).toEqual({
      bucket: 'attach',
      file: 'dir/file.html',
    });
  });

  it('returns null for non-artifact hrefs', () => {
    expect(parseArtifactHref('https://example.com/a/b')).toBeNull();
  });
});

describe('resolveArtifactHref with a custom resolver', () => {
  it('passes the parsed artifact to the resolver', () => {
    const resolver = vi.fn(() => '/public/url');

    expect(resolveArtifactHref('/attach/file.html', resolver)).toBe('/public/url');
    expect(resolver).toHaveBeenCalledWith({ bucket: 'attach', file: 'file.html' });
  });

  it('returns null when the resolver cannot open the file', () => {
    expect(resolveArtifactHref('/attach/file.html', () => null)).toBeNull();
  });

  it('does not call the resolver for non-artifact links', () => {
    const resolver = vi.fn();

    expect(resolveArtifactHref('https://example.com', resolver)).toBe('https://example.com');
    expect(resolver).not.toHaveBeenCalled();
  });
});
