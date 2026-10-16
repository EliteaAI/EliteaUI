import { ProjectBackupConstants } from '@/[fsd]/features/settings/lib/constants';
import { ProjectBackupHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { getFilenameFromContentDisposition } from '@/[fsd]/shared/lib/helpers';
import { eliteaApi } from '@/api';

import { TAG_TYPE_CHAT_TEMPLATES } from './chatTemplateApi';

const { CHAT_TAG_TYPES } = ProjectBackupConstants;
const { getRestoreInvalidatedTags } = ProjectBackupHelpers;

const apiSlicePath = '/admin';

const projectBackupApi = eliteaApi
  .enhanceEndpoints({ addTagTypes: [TAG_TYPE_CHAT_TEMPLATES, ...CHAT_TAG_TYPES] })
  .injectEndpoints({
    endpoints: build => ({
      projectBackupSummary: build.query({
        query: ({ projectId }) => ({
          url: `${apiSlicePath}/project_backup_summary/prompt_lib/${projectId}`,
        }),
        keepUnusedDataFor: 0,
      }),
      downloadProjectBackup: build.query({
        query: ({ projectId, excludeTables = '', includeChats }) => ({
          url: `${apiSlicePath}/project_backup/prompt_lib/${projectId}`,
          params: {
            ...(excludeTables ? { exclude_tables: excludeTables } : {}),
            ...(includeChats ? { include_chats: includeChats } : {}),
          },
          responseHandler: async response => {
            // fetchBaseQuery rejects non-ok responses on its own via .unwrap(), surfacing
            // the JSON error body as err.data — only the success path needs handling here.
            const contentDisposition = response.headers.get('content-disposition') || '';
            const fallbackName =
              includeChats === 'with_attachments' ? 'project-backup.zip.enc' : 'project-backup.sql.enc';
            const filename = getFilenameFromContentDisposition(contentDisposition, fallbackName);
            const blob = await response.blob();
            return { blob, filename };
          },
        }),
        // The artifact can be several megabytes — do not keep it in the store
        keepUnusedDataFor: 0,
        providesTags: [],
      }),
      restoreProjectBackup: build.mutation({
        query: ({ projectId, file, truncate, dryRun, allowProjectMismatch, restoreChats, inspect }) => {
          const form = new FormData();
          form.append('file', file);
          form.append('truncate', truncate ? 'true' : 'false');
          form.append('dry_run', dryRun ? 'true' : 'false');
          form.append('allow_project_mismatch', allowProjectMismatch ? 'true' : 'false');
          if (restoreChats) form.append('restore_chats', restoreChats);
          if (inspect) form.append('inspect', 'true');

          return {
            url: `${apiSlicePath}/project_restore/prompt_lib/${projectId}`,
            method: 'POST',
            body: form,
            formData: true,
          };
        },
        // A restore rewrites the project's chat templates, which stay cached otherwise
        invalidatesTags: (_, error, args) => getRestoreInvalidatedTags(error, args, TAG_TYPE_CHAT_TEMPLATES),
      }),
    }),
  });

export const {
  useLazyDownloadProjectBackupQuery,
  useProjectBackupSummaryQuery,
  useRestoreProjectBackupMutation,
} = projectBackupApi;

export default projectBackupApi;
