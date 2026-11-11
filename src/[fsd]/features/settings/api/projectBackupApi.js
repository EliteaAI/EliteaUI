import { ProjectBackupConstants } from '@/[fsd]/features/settings/lib/constants';
import { ProjectBackupHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { getFilenameFromContentDisposition } from '@/[fsd]/shared/lib/helpers';
import { eliteaApi } from '@/api';

import { TAG_TYPE_CHAT_TEMPLATES } from './chatTemplateApi';

const { CHATS_OPTION, CHAT_TAG_TYPES, INSPECT_BYTES } = ProjectBackupConstants;
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
        query: ({ projectId, excludeTables = '', includeChats, includeSkillFiles }) => ({
          url: `${apiSlicePath}/project_backup/prompt_lib/${projectId}`,
          params: {
            ...(excludeTables ? { exclude_tables: excludeTables } : {}),
            ...(includeChats ? { include_chats: includeChats } : {}),
            ...(includeSkillFiles ? { include_skill_files: includeSkillFiles } : {}),
          },
          responseHandler: async response => {
            // fetchBaseQuery rejects non-ok responses on its own via .unwrap(), surfacing
            // the JSON error body as err.data — only the success path needs handling here.
            const contentDisposition = response.headers.get('content-disposition') || '';
            const fallbackName =
              includeChats === CHATS_OPTION.withAttachments
                ? 'project-backup.zip.enc'
                : 'project-backup.sql.enc';
            const filename = getFilenameFromContentDisposition(contentDisposition, fallbackName);
            const blob = await response.blob();
            return { blob, filename };
          },
        }),
        // The artifact can be several megabytes — do not keep it in the store
        keepUnusedDataFor: 0,
        providesTags: [],
      }),
      // Starts the restore and answers with its job right away; the result is
      // read with restoreProjectJob. With inspect it only reads the file header.
      restoreProjectBackup: build.mutation({
        query: ({ projectId, file, truncate, dryRun, allowProjectMismatch, restoreChats, inspect }) => {
          const form = new FormData();
          if (inspect) {
            form.append('file', file.slice(0, INSPECT_BYTES), file.name);
            form.append('inspect', 'true');
            form.append('size', String(file.size));
          } else {
            form.append('file', file);
            form.append('background', 'true');
          }
          form.append('truncate', truncate ? 'true' : 'false');
          form.append('dry_run', dryRun ? 'true' : 'false');
          form.append('allow_project_mismatch', allowProjectMismatch ? 'true' : 'false');
          if (restoreChats) form.append('restore_chats', restoreChats);

          return {
            url: `${apiSlicePath}/project_restore/prompt_lib/${projectId}`,
            method: 'POST',
            body: form,
            formData: true,
          };
        },
      }),
      restoreProjectJob: build.query({
        query: ({ projectId, jobId }) => ({
          url: `${apiSlicePath}/project_restore_job/prompt_lib/${projectId}/${jobId}`,
        }),
        keepUnusedDataFor: 0,
      }),
      // Called once the job has finished: a restore rewrites the project's chat
      // templates (and chats), which stay cached otherwise
      invalidateAfterRestore: build.mutation({
        queryFn: () => ({ data: null }),
        invalidatesTags: (_, error, args) => getRestoreInvalidatedTags(error, args, TAG_TYPE_CHAT_TEMPLATES),
      }),
    }),
  });

export const {
  useLazyDownloadProjectBackupQuery,
  useProjectBackupSummaryQuery,
  useRestoreProjectBackupMutation,
  useRestoreProjectJobQuery,
  useInvalidateAfterRestoreMutation,
} = projectBackupApi;

export default projectBackupApi;
