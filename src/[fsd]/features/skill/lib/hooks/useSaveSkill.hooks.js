import { useCallback } from 'react';

import { useFormikContext } from 'formik';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useSkillUpdateMutation } from '@/[fsd]/features/skill/api';
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
    const selectedVersionName = values?.version_details?.name || LATEST_VERSION_NAME;
    const name = values?.name?.trim() || '';
    const description = values?.description?.trim() || '';
    const instructions = values?.version_details?.instructions || '';
    const tags = values?.version_details?.tags || [];

    try {
      // Update skill-level metadata, then the content of the version actually
      // being viewed, addressed by name. Do NOT route `base` through the
      // version-less endpoint: a version-less write targets the skill's default
      // version, which may be a non-base version — so editing `base` would
      // silently land the instructions/tags on the default version instead.
      await updateSkill({ projectId, skillId, name, description }).unwrap();
      await updateSkill({
        projectId,
        skillId,
        versionName: selectedVersionName,
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
