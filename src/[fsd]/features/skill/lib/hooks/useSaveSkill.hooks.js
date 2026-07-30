import { useCallback } from 'react';

import { useFormikContext } from 'formik';

import { useSkillUpdateMutation } from '@/[fsd]/features/skill/api';
import { normalizeTagsForSave } from '@/[fsd]/features/skill/lib/helpers';
import { buildErrorMessage } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const useSaveSkill = () => {
  const projectId = useSelectedProjectId();
  const { values, resetForm } = useFormikContext();
  const { toastError, toastSuccess } = useToast();
  const [updateSkill, { isLoading: isSaving }] = useSkillUpdateMutation();

  const onSave = useCallback(async () => {
    const skillId = values?.id;
    const selectedVersionId = values?.version_details?.id;
    const name = values?.name?.trim() || '';
    const description = values?.description?.trim() || '';
    const instructions = values?.version_details?.instructions || '';
    const tags = normalizeTagsForSave(values?.version_details?.tags);

    // Without a version id the viewed version cannot be addressed — the
    // backend would fall back to the default version.
    if (!selectedVersionId) {
      toastError('Unable to determine the skill version to save. Please reload and try again.');
      return false;
    }

    try {
      await updateSkill({
        projectId,
        skillId,
        name,
        description,
        version: {
          id: selectedVersionId,
          instructions,
          tags,
        },
      }).unwrap();

      resetForm({ values });
      toastSuccess('Skill saved');
      return true;
    } catch (e) {
      toastError(buildErrorMessage(e));
      return false;
    }
  }, [values, projectId, updateSkill, resetForm, toastSuccess, toastError]);

  return { onSave, isSaving };
};

export default useSaveSkill;
