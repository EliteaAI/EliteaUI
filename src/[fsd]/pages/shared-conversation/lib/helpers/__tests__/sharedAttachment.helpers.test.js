/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { buildSharedArtifactLinkResolver, buildSharedAttachment } from '../sharedAttachment.helpers';

const BASE_URL = `${window.location.protocol}//${window.location.host}/api/v2/elitea_core/shared_chat_attachment/prompt_lib`;

describe('buildSharedAttachment', () => {
  it('uses the public shared endpoint as download_url for non-image attachments', () => {
    const result = buildSharedAttachment(
      {
        attachment: {
          name: 'reports/cross repo assessment.html',
          bucket: 'architecture',
          attachment_type: 'document',
        },
      },
      'tok',
      42,
    );

    expect(result).toEqual({
      name: 'cross repo assessment.html',
      item_details: {
        name: 'cross repo assessment.html',
        bucket: 'architecture',
        attachment_type: 'document',
        download_url: `${BASE_URL}/tok/42/cross%20repo%20assessment.html`,
      },
    });
    expect(result.item_details.filepath).toBeUndefined();
  });

  it('uses the public shared endpoint as image_url for images', () => {
    const result = buildSharedAttachment(
      { attachment: { name: 'dog.png', bucket: 'attach', attachment_type: 'image' } },
      'tok',
      7,
    );

    expect(result.item_details.content).toEqual([
      { type: 'image_url', image_url: { url: `${BASE_URL}/tok/7/dog.png` } },
    ]);
    expect(result.item_details.download_url).toBeUndefined();
  });

  it('returns null when the item has no attachment', () => {
    expect(buildSharedAttachment({}, 'tok', 1)).toBeNull();
  });
});

describe('buildSharedArtifactLinkResolver', () => {
  const groups = [
    { id: 1, items: [{ type: 'text_message', content: 'hi' }] },
    {
      id: 5,
      items: [
        { type: 'attachment_message', attachment: { name: 'artifact-demo.html', bucket: 'attach' } },
        { type: 'attachment_message', attachment: { name: 'reports/q3 summary.html', bucket: 'docs' } },
      ],
    },
  ];

  it('maps a conversation attachment to the public shared endpoint', () => {
    const resolve = buildSharedArtifactLinkResolver(groups, 'tok');

    expect(resolve({ bucket: 'attach', file: 'artifact-demo.html' })).toBe(
      `${BASE_URL}/tok/5/artifact-demo.html`,
    );
    expect(resolve({ bucket: 'docs', file: 'reports/q3 summary.html' })).toBe(
      `${BASE_URL}/tok/5/q3%20summary.html`,
    );
  });

  it('returns null for files that are not attachments of the conversation', () => {
    const resolve = buildSharedArtifactLinkResolver(groups, 'tok');

    expect(resolve({ bucket: 'attach', file: 'secret.html' })).toBeNull();
    expect(resolve({ bucket: 'other', file: 'artifact-demo.html' })).toBeNull();
  });

  it('handles missing groups', () => {
    expect(buildSharedArtifactLinkResolver(undefined, 'tok')({ bucket: 'a', file: 'b' })).toBeNull();
  });
});
