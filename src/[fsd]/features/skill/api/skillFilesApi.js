import { eliteaApi } from '@/api/eliteaApi.js';

const apiSlicePath = '/elitea_core';
const mode = 'prompt_lib';

const TAG_SKILL_FILES = 'TAG_SKILL_FILES';
const TAG_SKILL_FILE_CONTENT = 'TAG_SKILL_FILE_CONTENT';

const EMPTY_FILES = [];

const encodeFilePath = path => path.split('/').map(encodeURIComponent).join('/');

const versionUrl = ({ projectId, skillId, versionId }) =>
  `${apiSlicePath}/skill_files/${mode}/${projectId}/${skillId}/${versionId}`;

const fileUrl = ({ projectId, skillId, versionId, path }) =>
  `${apiSlicePath}/skill_file/${mode}/${projectId}/${skillId}/${versionId}/${encodeFilePath(path)}`;

const toSkillFile = entry => ({
  path: entry.path,
  size: entry.size,
  sha256: entry.sha256,
  contentType: entry.content_type,
  isText: Boolean(entry.is_text),
});

const contentTag = ({ versionId, path }) => ({ type: TAG_SKILL_FILE_CONTENT, id: `${versionId}:${path}` });

const invalidateFiles = (versionId, paths) => [
  { type: TAG_SKILL_FILES, id: versionId },
  ...paths.map(path => contentTag({ versionId, path })),
];

const skillFilesApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_SKILL_FILES, TAG_SKILL_FILE_CONTENT],
  })
  .injectEndpoints({
    endpoints: build => ({
      skillVersionFiles: build.query({
        query: versionUrl,
        transformResponse: response => response?.files?.map(toSkillFile) ?? EMPTY_FILES,
        providesTags: (result, error, { versionId }) => [{ type: TAG_SKILL_FILES, id: versionId }],
      }),
      skillVersionFileText: build.query({
        query: args => ({ url: fileUrl(args), responseHandler: 'text' }),
        providesTags: (result, error, args) => [contentTag(args)],
      }),
      skillVersionFileBlob: build.query({
        query: args => ({ url: fileUrl(args), responseHandler: response => response.blob() }),
        keepUnusedDataFor: 0,
      }),
      uploadSkillVersionFile: build.mutation({
        query: ({ file, ...args }) => {
          const form = new FormData();
          form.append('file', file);
          return { url: fileUrl(args), method: 'PUT', body: form, formData: true };
        },
        invalidatesTags: (result, error, { versionId, path }) =>
          error ? [] : invalidateFiles(versionId, [path]),
      }),
      renameSkillVersionFile: build.mutation({
        query: ({ newPath, ...args }) => ({
          url: fileUrl(args),
          method: 'PATCH',
          body: { new_path: newPath },
        }),
        invalidatesTags: (result, error, { versionId, newPath }) =>
          error ? [] : invalidateFiles(versionId, [newPath]),
      }),
      deleteSkillVersionFile: build.mutation({
        query: args => ({ url: fileUrl(args), method: 'DELETE' }),
        invalidatesTags: (result, error, { versionId }) => (error ? [] : invalidateFiles(versionId, [])),
      }),
    }),
  });

export const {
  useSkillVersionFilesQuery,
  useSkillVersionFileTextQuery,
  useLazySkillVersionFileBlobQuery,
  useUploadSkillVersionFileMutation,
  useRenameSkillVersionFileMutation,
  useDeleteSkillVersionFileMutation,
} = skillFilesApi;
