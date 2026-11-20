import { describe, expect, it } from 'vitest';

import { escapeGfmDisallowedRawHtml } from '../markdown.utils';

describe('escapeGfmDisallowedRawHtml', () => {
  it.each([
    ['<script>alert(1)</script>', '&lt;script>alert(1)&lt;/script>'],
    ['<SCRIPT >x</SCRIPT>', '&lt;SCRIPT >x&lt;/SCRIPT>'],
    ['<style/>', '&lt;style/>'],
    ['<title\nlang="en">', '&lt;title\nlang="en">'],
    [
      '<textarea><xmp><iframe><noembed><noframes><plaintext>',
      '&lt;textarea>&lt;xmp>&lt;iframe>&lt;noembed>&lt;noframes>&lt;plaintext>',
    ],
  ])('escapes the leading bracket of %j', (html, escaped) => {
    expect(escapeGfmDisallowedRawHtml(html)).toBe(escaped);
  });

  it.each([
    '<scripty>',
    '<scripts>',
    '<script-x>',
    '<svg width=10></svg>',
    '<math>',
    '<template>',
    '<img src="x">',
    '<details><summary>More</summary></details>',
    '<b>x</b><br/><kbd>Ctrl</kbd>',
  ])('leaves %j untouched', html => {
    expect(escapeGfmDisallowedRawHtml(html)).toBe(html);
  });
});
