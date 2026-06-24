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

    try {
      // Update skill-level metadata, then the content of the version actually
      // being viewed, addressed by id. Do NOT route through the version-less
      // endpoint: a version-less write targets the skill's default version,
      // which may be a different version — so the edit would silently land on
      // the default version instead of the one being viewed.
      await updateSkill({ projectId, skillId, name, description }).unwrap();
      await updateSkill({
        projectId,
        skillId,
        versionId: selectedVersionId,
        instructions,
        tags,
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
