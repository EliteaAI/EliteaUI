import { describe, expect, it } from 'vitest';

import { buildNotificationEventsUrl } from './useNotificationEvents.hooks';

describe('buildNotificationEventsUrl', () => {
  it('builds the exact current notification SSE route', () => {
    expect(buildNotificationEventsUrl('/api/v2/', 7)).toBe('/api/v2/notifications/events/prompt_lib/7');
  });

  it('encodes the project path segment', () => {
    expect(buildNotificationEventsUrl('https://elitea.example/api/v2', 'team/project')).toBe(
      'https://elitea.example/api/v2/notifications/events/prompt_lib/team%2Fproject',
    );
  });
});
