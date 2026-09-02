import { getFilenameFromContentDisposition } from '@/[fsd]/shared/lib/helpers';
import { eliteaApi } from '@/api';

const apiSlicePath = '/admin';

const projectBackupApi = eliteaApi.injectEndpoints({
  endpoints: build => ({
    downloadProjectBackup: build.query({
      query: ({ projectId, excludeTables = '' }) => ({
        url: `${apiSlicePath}/project_backup/prompt_lib/${projectId}`,
        params: excludeTables ? { exclude_tables: excludeTables } : undefined,
        responseHandler: async response => {
          if (!response.ok) {
            // Errors are JSON, not a dump
            return await response.json();
          }
          const contentDisposition = response.headers.get('content-disposition') || '';
          const filename = getFilenameFromContentDisposition(contentDisposition, 'project-backup.sql');
          const blob = await response.blob();
          return { blob, filename };
        },
      }),
      // The artifact can be several megabytes — do not keep it in the store
      keepUnusedDataFor: 0,
      providesTags: [],
    }),
    restoreProjectBackup: build.mutation({
      query: ({ projectId, file, truncate, dryRun, allowProjectMismatch }) => {
        const form = new FormData();
        form.append('file', file);
        form.append('truncate', truncate ? 'true' : 'false');
        form.append('dry_run', dryRun ? 'true' : 'false');
        form.append('allow_project_mismatch', allowProjectMismatch ? 'true' : 'false');

        return {
          url: `${apiSlicePath}/project_restore/prompt_lib/${projectId}`,
          method: 'POST',
          body: form,
          formData: true,
        };
      },
      invalidatesTags: [],
    }),
  }),
});

export const { useLazyDownloadProjectBackupQuery, useRestoreProjectBackupMutation } = projectBackupApi;

export default projectBackupApi;
