import { eliteaApi } from './eliteaApi.js';

const TAG_BUCKETS = 'TAG_BUCKETS';
const TAG_ARTIFACTS = 'TAG_ARTIFACTS';

// Maximum length for the path + query string portion passed to baseQuery.
// Does not include the base URL (which varies per environment / proxy).
// Budget of 1500 chars for path+query leaves ~500 chars for any base URL,
// keeping the full resolved URL safely under the 2000-char practical minimum
// across browsers and nginx (default large_client_header_buffers of 4096 bytes).
const DELETE_ARTIFACTS_MAX_PATH_LENGTH = 1500;
const headers = {
  'Content-Type': 'application/json',
};

export const artifactsApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: ['artifacts'],
  })
  .injectEndpoints({
    endpoints: build => ({
      bucketList: build.query({
        queryFn: async ({ projectId }, { signal }) => {
          try {
            const params = new URLSearchParams({
              project_id: projectId,
              format: 'json',
            });
            const url = `/artifacts/s3/?${params.toString()}`;
            const response = await fetch(url, { signal });
            if (!response.ok) {
              return { error: { status: response.status, data: response.statusText } };
            }
            const data = await response.json();
            return { data };
          } catch (error) {
            if (error.name === 'AbortError') {
              return { error: { status: 'ABORT_ERROR', data: 'Request cancelled' } };
            }
            return { error: { status: 'FETCH_ERROR', data: error.message } };
          }
        },
        providesTags: [TAG_BUCKETS],
      }),
      createBucket: build.mutation({
        query: ({ projectId, ...body }) => ({
          url: `/artifacts/buckets/default/${projectId}`,
          method: 'POST',
          headers,
          body,
        }),
        invalidatesTags: [TAG_BUCKETS],
      }),
      editBucket: build.mutation({
        query: ({ projectId, ...body }) => ({
          url: `/artifacts/buckets/default/${projectId}`,
          method: 'PUT',
          headers,
          body,
        }),
        invalidatesTags: [TAG_BUCKETS],
      }),
      updateBucketPin: build.mutation({
        query: ({ projectId, bucketName, isPinned }) => ({
          url: `/artifacts/buckets/default/${projectId}?name=${encodeURI(bucketName)}`,
          method: 'PATCH',
          headers,
          body: { is_pinned: isPinned },
        }),
        invalidatesTags: [TAG_BUCKETS],
      }),
      deleteBucket: build.mutation({
        query: ({ projectId, bucket }) => ({
          url: `/artifacts/buckets/default/${projectId}?name=${encodeURI(bucket)}`,
          method: 'DELETE',
        }),
        invalidatesTags: [TAG_BUCKETS],
      }),
      artifactList: build.query({
        queryFn: async ({ projectId, bucket, continuationToken }, { signal }) => {
          try {
            const params = new URLSearchParams({ project_id: projectId, format: 'json' });
            if (continuationToken) {
              params.set('continuation-token', continuationToken);
            }
            const url = `/artifacts/s3/${encodeURI(bucket)}?${params.toString()}`;
            const response = await fetch(url, { signal });
            if (!response.ok) {
              return { error: { status: response.status, data: response.statusText } };
            }
            const data = await response.json();
            return { data };
          } catch (error) {
            if (error.name === 'AbortError') {
              return { error: { status: 'ABORT_ERROR', data: 'Request cancelled' } };
            }
            return { error: { status: 'FETCH_ERROR', data: error.message } };
          }
        },
        providesTags: [TAG_ARTIFACTS],
      }),
      createArtifact: build.mutation({
        query: ({ projectId, bucket, files, withOverwrite }) => {
          const form = new FormData();
          if (files?.length) {
            for (let i = 0; i < files.length; i++) {
              form.append('file', files[i]);

              if (withOverwrite) form.append('overwrite_attachments', 1);
            }
          }
          return {
            url: `/artifacts/artifacts/default/${projectId}/${encodeURI(bucket)}`,
            method: 'POST',
            body: form,
            formData: true,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [TAG_ARTIFACTS, TAG_BUCKETS]; // Also invalidate buckets when files change
        },
      }),
      deleteArtifact: build.mutation({
        query: ({ projectId, bucket, artifact, integration_id, is_local }) => {
          return {
            url: `/artifacts/artifact/default/${projectId}/${encodeURI(bucket)}`,
            method: 'DELETE',
            params: { integration_id, is_local, filename: encodeURIComponent(artifact) },
          };
        },
        invalidatesTags: [TAG_ARTIFACTS, TAG_BUCKETS], // Also invalidate buckets when files are deleted
      }),
      deleteArtifacts: build.mutation({
        queryFn: async ({ projectId, bucket, fname }, _queryApi, _extraOptions, baseQuery) => {
          const base = `/artifacts/artifacts/default/${projectId}/${encodeURI(bucket)}`;

          const chunks = [];
          let current = [];
          let currentLen = base.length + 1; // +1 for '?'

          for (const name of fname) {
            const param = `fname[]=${encodeURIComponent(name)}&`;
            if (currentLen + param.length > DELETE_ARTIFACTS_MAX_PATH_LENGTH && current.length > 0) {
              chunks.push(current);
              current = [];
              currentLen = base.length + 1;
            }
            current.push(name);
            currentLen += param.length;
          }
          if (current.length > 0) chunks.push(current);

          // Execute sequentially so a failure stops further deletions immediately,
          // avoiding partial deletes continuing after an error.
          for (const chunk of chunks) {
            const result = await baseQuery({
              url: `${base}?${chunk.map(n => `fname[]=${encodeURIComponent(n)}`).join('&')}`,
              method: 'DELETE',
            });
            if (result.error) return { error: result.error };
          }
          return { data: null };
        },
        invalidatesTags: [TAG_ARTIFACTS, TAG_BUCKETS],
      }),
    }),
  });

export const {
  useBucketListQuery,
  useArtifactListQuery,
  useLazyArtifactListQuery,
  useCreateBucketMutation,
  useEditBucketMutation,
  useUpdateBucketPinMutation,
  useDeleteBucketMutation,
  useCreateArtifactMutation,
  useDeleteArtifactMutation,
  useDeleteArtifactsMutation,
} = artifactsApi;
