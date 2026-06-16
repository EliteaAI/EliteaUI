import { useCallback } from 'react';

import { useFormikContext } from 'formik';

import { useSkillCreateVersionMutation } from '@/api/skills';
import { buildErrorMessage } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

/**
 * Create a new named skill version from the current form content. Mirrors the
 * agents' useSaveNewVersion — the mutation lives in a hook consumed by a
 * page-level button. Name validation (reserved/duplicate) stays in the button,
 * next to the dialog input.
 *
 * @returns {{ onCreateNewVersion: (name: string) => Promise<boolean>, isSavingNewVersion: boolean }}
 */
const useSaveSkillVersion = () => {
  const projectId = useSelectedProjectId();
  const { values, resetForm } = useFormikContext();
  const { toastError, toastSuccess } = useToast();
  const [createVersion, { isLoading: isSavingNewVersion }] = useSkillCreateVersionMutation();

  const onCreateNewVersion = useCallback(
    async name => {
      try {
        await createVersion({
          projectId,
          skillId: values?.id,
          name,
          instructions: values?.version_details?.instructions || '',
          tags: values?.version_details?.tags || [],
        }).unwrap();

        resetForm({ values });
        toastSuccess(`Version "${name}" created`);
        return true;
      } catch (e) {
        toastError(buildErrorMessage(e));
        return false;
      }
    },
    [createVersion, projectId, values, resetForm, toastSuccess, toastError],
  );

  return { onCreateNewVersion, isSavingNewVersion };
};

export default useSaveSkillVersion;
