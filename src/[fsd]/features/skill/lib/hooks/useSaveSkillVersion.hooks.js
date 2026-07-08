import { useCallback } from 'react';

import { useFormikContext } from 'formik';

import { useSkillCreateVersionMutation } from '@/[fsd]/features/skill/api';
import { normalizeTagsForSave } from '@/[fsd]/features/skill/lib/helpers';
import { buildErrorMessage } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const useSaveSkillVersion = () => {
  const projectId = useSelectedProjectId();
  const { values, resetForm } = useFormikContext();
  const { toastError, toastSuccess } = useToast();
  const [createVersion, { isLoading: isSavingNewVersion }] = useSkillCreateVersionMutation();

  const onCreateNewVersion = useCallback(
    async name => {
      try {
        const created = await createVersion({
          projectId,
          skillId: values?.id,
          name,
          instructions: values?.version_details?.instructions || '',
          tags: normalizeTagsForSave(values?.version_details?.tags),
          meta: values?.version_details?.meta || {},
        }).unwrap();

        resetForm({ values });
        toastSuccess(`Version "${name}" created`);
        return created;
      } catch (e) {
        toastError(buildErrorMessage(e));
        return null;
      }
    },
    [createVersion, projectId, values, resetForm, toastSuccess, toastError],
  );

  return { onCreateNewVersion, isSavingNewVersion };
};

export default useSaveSkillVersion;
