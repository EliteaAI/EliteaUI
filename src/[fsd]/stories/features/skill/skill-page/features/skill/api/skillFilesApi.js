import { eliteaApi } from '@/api/eliteaApi.js';

// Proposed endpoint (prototype): the files of a skill version, { files: [{ path, size, binary, content }] }.
// The backend stores the files (files_from_version_id on save) but has no list endpoint yet.
const apiSlicePath = '/elitea_core/skill_files/prompt_lib';

const TAG_SKILL_FILES = 'TAG_SKILL_FILES';

const EMPTY_FILES = [];

const skillFilesApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_SKILL_FILES],
  })
  .injectEndpoints({
    endpoints: build => ({
      skillVersionFiles: build.query({
        query: ({ projectId, versionId }) => ({
          url: `${apiSlicePath}/${projectId}/${versionId}`,
        }),
        transformResponse: response => response?.files ?? EMPTY_FILES,
        providesTags: [TAG_SKILL_FILES],
      }),
    }),
  });

export const { useSkillVersionFilesQuery } = skillFilesApi;
