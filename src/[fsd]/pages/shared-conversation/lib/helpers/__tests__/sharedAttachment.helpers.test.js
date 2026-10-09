/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { buildSharedAttachment } from '../sharedAttachment.helpers';

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
