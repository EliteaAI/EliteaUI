import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import { MAX_INSTRUCTIONS_LENGTH } from '@/common/constants';

export const useSkillInstructionsMaxLength = () => {
  const { data: platformSettings } = useGetPlatformSettingsQuery();
  return platformSettings?.skill_instructions_max_length ?? MAX_INSTRUCTIONS_LENGTH;
};
