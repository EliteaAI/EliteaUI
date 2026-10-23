import { useCallback } from 'react';

import { useFormikContext } from 'formik';

import { useSkillCreateVersionMutation } from '@/[fsd]/features/skill/api';
import {
  instructionsTooLongMessage,
  normalizeTagsForSave,
  toRunSettingsPayload,
} from '@/[fsd]/features/skill/lib/helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage } from '@/common/utils.jsx';

import { useSkillInstructionsMaxLength } from './useSkillInstructionsMaxLength.hooks';

const useSaveSkillVersion = () => {
  const projectId = useSelectedProjectId();
  const { values, resetForm } = useFormikContext();
  const { toastError, toastSuccess } = useToast();
  const [createVersion, { isLoading: isSavingNewVersion }] = useSkillCreateVersionMutation();
  const maxInstructionsLength = useSkillInstructionsMaxLength();

  const onCreateNewVersion = useCallback(
    async name => {
      const instructions = values?.version_details?.instructions || '';
      if (instructions.length > maxInstructionsLength) {
        toastError(instructionsTooLongMessage(instructions.length, maxInstructionsLength));
        return null;
      }
      try {
        const created = await createVersion({
          projectId,
          skillId: values?.id,
          name,
          instructions,
          tags: normalizeTagsForSave(values?.version_details?.tags),
          meta: values?.version_details?.meta || {},
          run_settings: toRunSettingsPayload(values?.version_details?.run_settings),
        }).unwrap();

        resetForm({ values });
        toastSuccess(`Version "${name}" created`);
        return created;
      } catch (e) {
        toastError(buildErrorMessage(e));
        return null;
      }
    },
    [createVersion, projectId, values, resetForm, toastSuccess, toastError, maxInstructionsLength],
  );

  return { onCreateNewVersion, isSavingNewVersion };
};

export default useSaveSkillVersion;
