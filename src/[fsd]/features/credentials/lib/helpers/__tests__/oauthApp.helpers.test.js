import { describe, expect, it } from 'vitest';

import {
  OAUTH_APP_MODES,
  filterOAuthAppSubsections,
  resolveOAuthAppMode,
} from '@/[fsd]/features/credentials/lib/helpers/oauthApp.helpers';

const SUBSECTIONS = [{ name: 'Default app' }, { name: 'Custom app' }, { name: 'App-only' }];
const names = list => list.map(sub => sub.name);

describe('oauthApp.helpers', () => {
  it('a default app leaves only the Default app subsection', () => {
    expect(names(filterOAuthAppSubsections(SUBSECTIONS, OAUTH_APP_MODES.default))).toEqual(['Default app']);
  });

  it('no usable app leaves only the user’s own app subsections', () => {
    expect(names(filterOAuthAppSubsections(SUBSECTIONS, OAUTH_APP_MODES.custom))).toEqual([
      'Custom app',
      'App-only',
    ]);
  });

  it('apps without a default offer every subsection', () => {
    expect(names(filterOAuthAppSubsections(SUBSECTIONS, OAUTH_APP_MODES.choice))).toEqual(names(SUBSECTIONS));
  });

  it('a credential still referencing a removed app keeps the switcher so it can move to Custom app', () => {
    expect(resolveOAuthAppMode({ mode: 'custom' }, { oauth_app_id: 'gone' })).toBe(OAUTH_APP_MODES.choice);
    expect(resolveOAuthAppMode({ mode: 'default' }, { oauth_app_id: 'a' })).toBe(OAUTH_APP_MODES.default);
    expect(resolveOAuthAppMode({ mode: 'custom' }, { client_id: 'own' })).toBe(OAUTH_APP_MODES.custom);
  });

  it('an existing credential with its own app is never switched to the default app', () => {
    expect(resolveOAuthAppMode({ mode: 'default' }, { client_id: 'own' })).toBe(OAUTH_APP_MODES.choice);
    expect(resolveOAuthAppMode({ mode: 'default' }, {})).toBe(OAUTH_APP_MODES.default);
    expect(resolveOAuthAppMode(undefined, {})).toBe(OAUTH_APP_MODES.custom);
  });
});
