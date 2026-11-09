// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildCopyTextPayload,
  getChatMessageCopySource,
  markdownToHtml,
  markdownToPlainText,
  writeRichTextToClipboard,
} from '../messageCopy.helpers';

const SAMPLE = [
  '# Title &amp; more',
  '',
  'Some **bold** and *italic* with `a*b*` code',
  '',
  '- one',
  '- [link](https://example.com)',
  '  1. nested',
  '',
  '> quoted',
  '',
  '| a | b |',
  '|---|---|',
  '| 1 | **2** |',
  '',
  '```js',
  "  const x = '**#';",
  '```',
].join('\n');

describe('markdownToPlainText', () => {
  const text = markdownToPlainText(SAMPLE);

  it('removes heading, emphasis and fence markers', () => {
    expect(text).toContain('Title & more');
    expect(text).not.toMatch(/^#/m);
    expect(text).toContain('Some bold and italic with a*b* code');
    expect(text).not.toContain('```');
  });

  it('keeps code literally, including indentation and markdown characters', () => {
    expect(text).toContain("  const x = '**#';");
  });

  it('keeps list structure and link destinations', () => {
    expect(text).toContain('• one');
    expect(text).toContain('• link (https://example.com)');
    expect(text).toContain('  1. nested');
  });

  it('keeps blockquotes and tables readable', () => {
    expect(text).toContain('    quoted');
    expect(text).toContain('a\tb\n1\t2');
  });

  it('returns empty string for empty input', () => {
    expect(markdownToPlainText('')).toBe('');
  });
});

describe('markdownToHtml', () => {
  it('renders formatting and keeps hyperlinks', () => {
    const html = markdownToHtml(SAMPLE);
    expect(html).toContain('<h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<a href="https://example.com">link</a>');
    expect(html).toContain('<table>');
    expect(html).toContain('<code');
  });

  it('strips scripts, styles and interactive controls', () => {
    const html = markdownToHtml(
      '<script>alert(1)</script><style>p{}</style><p style="color:red" onclick="x()">hi</p>\n\n- [x] task',
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<style');
    expect(html).not.toContain('style=');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('<input');
    expect(html).toContain('hi');
  });
});

describe('getChatMessageCopySource', () => {
  it('uses the original content as markdown source', () => {
    const source = getChatMessageCopySource({ content: SAMPLE });
    expect(source.markdown).toBe(SAMPLE);
    expect(source.isMarkdown).toBe(true);
  });

  it('joins text and canvas items and skips attachments', () => {
    const source = getChatMessageCopySource({
      message_items: [
        { item_type: 'text_message', item_details: { content: 'first' } },
        { item_type: 'attachment_message', item_details: { name: 'file.pdf' } },
        {
          item_type: 'canvas_message',
          item_details: {
            canvas_type: 'code',
            latest_version: { canvas_content: 'print(1)', code_language: 'python' },
          },
        },
      ],
    });
    expect(source.markdown).toBe('first\n\nprint(1)');
    expect(source.rendered).toBe('first\n\n```python\nprint(1)\n```');
  });

  it('fences JSON answers for rendering but keeps the source untouched', () => {
    const source = getChatMessageCopySource({ content: '{"a":1}' });
    expect(source.markdown).toBe('{"a":1}');
    expect(markdownToPlainText(source.rendered)).toContain('"a": 1');
  });

  it('copies only the question and injected text of a user message', () => {
    const source = getChatMessageCopySource({
      role: 'user',
      message_items: [
        { item_type: 'text_message', item_details: { content: 'question' } },
        { item_type: 'attachment_message', item_details: { name: 'a.png' } },
        { item_type: 'text_message', item_details: { content: 'injected' } },
      ],
    });
    expect(source.markdown).toBe('question\n\ninjected');
  });

  it('copies user input and exceptions as plain text', () => {
    const user = getChatMessageCopySource({
      role: 'user',
      message_items: [{ item_type: 'text_message', item_details: { content: '**hi**' } }],
    });
    expect(user).toEqual({
      markdown: '**hi**',
      rendered: '**hi**',
      isMarkdown: false,
      isPreformatted: false,
    });
    expect(buildCopyTextPayload(user)).toEqual({ html: '', text: '**hi**' });

    const exception = getChatMessageCopySource({ exception: 'Boom <tag>' });
    expect(exception.isMarkdown).toBe(false);
    expect(buildCopyTextPayload(exception).html).toBe('<pre>Boom &lt;tag&gt;</pre>');
  });
});

describe('writeRichTextToClipboard', () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
    vi.unstubAllGlobals();
  });

  it('writes html and plain text when rich clipboard is supported', async () => {
    const write = vi.fn().mockResolvedValue();
    const writeText = vi.fn();
    vi.stubGlobal(
      'ClipboardItem',
      vi.fn(function ClipboardItemMock(items) {
        this.types = Object.keys(items);
      }),
    );
    Object.defineProperty(navigator, 'clipboard', { value: { write, writeText }, configurable: true });

    await writeRichTextToClipboard({ html: '<b>x</b>', text: 'x' });

    expect(write).toHaveBeenCalledTimes(1);
    expect(write.mock.calls[0][0][0].types).toEqual(['text/html', 'text/plain']);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to plain text when rich clipboard fails', async () => {
    const write = vi.fn().mockRejectedValue(new Error('denied'));
    const writeText = vi.fn().mockResolvedValue();
    vi.stubGlobal('ClipboardItem', vi.fn());
    Object.defineProperty(navigator, 'clipboard', { value: { write, writeText }, configurable: true });

    await writeRichTextToClipboard({ html: '<b>x</b>', text: 'x' });

    expect(writeText).toHaveBeenCalledWith('x');
  });
});
