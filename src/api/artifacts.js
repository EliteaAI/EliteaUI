import { alitaApi } from './alitaApi.js';

const TAG_BUCKETS = 'TAG_BUCKETS';
const TAG_ARTIFACTS = 'TAG_ARTIFACTS';
const headers = {
  'Content-Type': 'application/json',
};

export const artifactsApi = alitaApi
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
            // Sort buckets by name to match original backend behavior
            if (data.buckets && Array.isArray(data.buckets)) {
              data.buckets.sort((a, b) => a.name.localeCompare(b.name));
            }
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
      deleteBucket: build.mutation({
        query: ({ projectId, bucket }) => ({
          url: `/artifacts/buckets/default/${projectId}?name=${encodeURI(bucket)}`,
          method: 'DELETE',
        }),
        invalidatesTags: [TAG_BUCKETS],
      }),
      artifactList: build.query({
        queryFn: async ({ projectId, bucket }, { signal }) => {
          try {
            const params = new URLSearchParams({
              project_id: projectId,
              format: 'json',
            });
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
        query: ({ projectId, bucket, fname }) => ({
          url: `/artifacts/artifacts/default/${projectId}/${encodeURI(bucket)}?${fname.map(name => `fname[]=${encodeURI(name)}`).join('&')}`,
          method: 'DELETE',
        }),
        invalidatesTags: [TAG_ARTIFACTS, TAG_BUCKETS], // Also invalidate buckets when files are deleted
      }),
    }),
  });

export const {
  useBucketListQuery,
  useArtifactListQuery,
  useCreateBucketMutation,
  useEditBucketMutation,
  useDeleteBucketMutation,
  useCreateArtifactMutation,
  useDeleteArtifactMutation,
  useDeleteArtifactsMutation,
} = artifactsApi;
