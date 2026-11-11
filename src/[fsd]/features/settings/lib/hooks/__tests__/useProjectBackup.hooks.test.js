// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useProjectBackup } from '../useProjectBackup.hooks.js';

const { download, toast } = vi.hoisted(() => ({
  download: vi.fn(() => ({ unwrap: () => Promise.resolve({ blob: 'blob', filename: 'backup.zip.enc' }) })),
  toast: { toastError: vi.fn(), toastInfo: vi.fn(), toastWarning: vi.fn() },
}));

vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { personal_project_id: 2 } }) }));
vi.mock('@/[fsd]/features/settings/api', () => ({
  useLazyDownloadProjectBackupQuery: () => [download, { isFetching: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 10,
  useToast: () => toast,
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/common/utils', () => ({ buildErrorMessage: () => '', downloadBlobFile: vi.fn() }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('useProjectBackup', () => {
  it('asks the backend to leave the skill files out only when they are not wanted', async () => {
    const { result } = renderHook(() => useProjectBackup());

    await act(() => result.current.doDownload({ chats: 'none', skillFiles: 'none' }));
    expect(download).toHaveBeenLastCalledWith({
      projectId: 10,
      includeChats: undefined,
      includeSkillFiles: 'none',
    });

    await act(() => result.current.doDownload({ chats: 'with_attachments', skillFiles: 'all' }));
    expect(download).toHaveBeenLastCalledWith({
      projectId: 10,
      includeChats: 'with_attachments',
      includeSkillFiles: undefined,
    });
  });
});
