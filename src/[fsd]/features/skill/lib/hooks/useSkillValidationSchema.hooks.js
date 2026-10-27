import { useMemo } from 'react';

import { SkillValidateSchema } from '@/[fsd]/features/skill/lib/validation';

import { useSkillInstructionsMaxLength } from './useSkillInstructionsMaxLength.hooks';

export const useSkillValidationSchema = savedSkill => {
  const maxInstructionsLength = useSkillInstructionsMaxLength();
  const savedName = savedSkill?.name;
  const savedDescription = savedSkill?.description;
  const savedInstructions = savedSkill?.version_details?.instructions;
  return useMemo(
    () =>
      SkillValidateSchema(maxInstructionsLength, savedInstructions, {
        name: savedName,
        description: savedDescription,
      }),
    [maxInstructionsLength, savedInstructions, savedName, savedDescription],
  );
};
