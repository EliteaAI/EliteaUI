import { afterEach, describe, expect, it, vi } from 'vitest';

import { SHARE_ACTIONS } from '../../constants/chatRights.constants';
import { getChatRights, getShareAction, isExternalChatSharingEnabled } from '../chatRights.helpers';

vi.mock('@/common/constants', () => ({ PUBLIC_PROJECT_ID: 1 }));

const rightsOf = (overrides = {}) =>
  getChatRights({
    conversation: { author_id: 2 },
    userId: 3,
    canManageShared: false,
    isExternalSharingEnabled: true,
    ...overrides,
  });

describe('getChatRights', () => {
  it('gives the owner everything', () => {
    expect(rightsOf({ userId: 2 })).toEqual({
      isOwner: true,
      canManage: true,
      canShareExternally: true,
      canDelete: true,
      canMoveToFolder: true,
    });
  });

  it('treats a chat not sent yet as the current user’s own', () => {
    expect(rightsOf({ conversation: { isNew: true } }).isOwner).toBe(true);
  });

  it('lets a manager manage and share, but not delete or move to a folder', () => {
    expect(rightsOf({ canManageShared: true })).toEqual({
      isOwner: false,
      canManage: true,
      canShareExternally: true,
      canDelete: false,
      canMoveToFolder: false,
    });
  });

  it('leaves an invited viewer nothing to manage', () => {
    expect(rightsOf()).toEqual({
      isOwner: false,
      canManage: false,
      canShareExternally: false,
      canDelete: false,
      canMoveToFolder: false,
    });
  });

  it('takes external sharing away when the platform turns it off', () => {
    expect(rightsOf({ userId: 2, isExternalSharingEnabled: false }).canShareExternally).toBe(false);
  });

  it('matches the owner id across number and string', () => {
    expect(rightsOf({ conversation: { author_id: '3' } }).isOwner).toBe(true);
  });
});

describe('getShareAction', () => {
  const owner = rightsOf({ userId: 2 });
  const viewer = rightsOf();

  it('opens the window for a manager in a team project and copies the link for anyone else', () => {
    expect(getShareAction({ rights: owner, projectId: 5, personalProjectId: 7 })).toBe(SHARE_ACTIONS.window);
    expect(getShareAction({ rights: viewer, projectId: 5, personalProjectId: 7 })).toBe(
      SHARE_ACTIONS.copyLink,
    );
  });

  it('hides Share in a private project when no option is left', () => {
    const noExternal = rightsOf({ userId: 2, isExternalSharingEnabled: false });
    expect(getShareAction({ rights: owner, projectId: 7, personalProjectId: 7 })).toBe(SHARE_ACTIONS.window);
    expect(getShareAction({ rights: noExternal, projectId: 7, personalProjectId: 7 })).toBe(
      SHARE_ACTIONS.none,
    );
  });

  it('keeps copying the link in the Public project', () => {
    expect(getShareAction({ rights: owner, projectId: 1, personalProjectId: 7 })).toBe(
      SHARE_ACTIONS.copyLink,
    );
  });
});

describe('isExternalChatSharingEnabled', () => {
  afterEach(() => {
    delete globalThis.elitea_ui_config;
  });

  it('is on when the setting is missing', () => {
    expect(isExternalChatSharingEnabled()).toBe(true);
  });

  it('follows the admin setting', () => {
    globalThis.elitea_ui_config = { chat_sharing: { external_enabled: false } };
    expect(isExternalChatSharingEnabled()).toBe(false);
    globalThis.elitea_ui_config = { chat_sharing: { external_enabled: true } };
    expect(isExternalChatSharingEnabled()).toBe(true);
  });
});
