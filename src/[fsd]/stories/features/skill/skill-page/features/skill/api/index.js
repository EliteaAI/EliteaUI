export {
  useSkillListQuery,
  useLazySkillListQuery,
  useTotalSkillsQuery,
  useSkillCreateMutation,
  useSkillDetailsQuery,
  useLazySkillDetailsQuery,
  useSkillCreateVersionMutation,
  useSkillUpdateMutation,
  useDeleteSkillMutation,
  useSetSkillDefaultVersionMutation,
  useLazySkillExportMdQuery,
  useLazySkillExportForkQuery,
  useSkillImportMutation,
  useUpdateSkillRelationMutation,
  useGetApplicationSkillsQuery,
  useLazyGetApplicationSkillsQuery,
  useGetSkillIconsQuery,
  useUploadSkillIconMutation,
  useReplaceSkillIconMutation,
  useDeleteSkillIconMutation,
  useValidateSkillForPublishMutation,
  usePublishSkillMutation,
  useUnpublishSkillMutation,
} from '@/[fsd]/features/skill/api/skillsApi';

export { useGenerateSkillDraftMutation } from '@/[fsd]/features/skill/api/generateSkillDraftApi';

export {
  useGetSkillCategoriesQuery,
  useLazyGetSkillCategoriesQuery,
} from '@/[fsd]/features/skill/api/skillCategoriesApi';

export { useSkillVersionFilesQuery } from './skillFilesApi';
