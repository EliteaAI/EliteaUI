import { useCallback } from 'react';

import { useFormikContext } from 'formik';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useSkillUpdateMutation } from '@/api/skills';
import { buildErrorMessage } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

/**
 * Save the current skill: metadata (name/description) plus the selected version's
 * content (instructions/tags). Mirrors the agents' useSaveVersion — the mutation
 * logic lives in a hook consumed by a page-level button, so the tab-bar entity
 * stays presentational.
 *
 * The API splits this by URL shape: a no-version PUT updates metadata + the
 * default ('base') version; a version-scoped PUT updates that version's content
 * (a body `name` there is treated as a rename, which is rejected for 'base').
 *
 * @returns {{ onSave: () => Promise<boolean>, isSaving: boolean }}
 */
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
    const isDefaultVersion = !selectedVersionName || selectedVersionName === LATEST_VERSION_NAME;

    try {
      if (isDefaultVersion) {
        await updateSkill({
          projectId,
          skillId,
          name,
          description,
          version: { instructions, tags },
        }).unwrap();
      } else {
        await updateSkill({ projectId, skillId, name, description }).unwrap();
        await updateSkill({
          projectId,
          skillId,
          versionName: selectedVersionName,
          instructions,
          tags,
        }).unwrap();
      }

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
