import { useCallback } from 'react';

import { useFormikContext } from 'formik';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version';
import { useSkillCreateMutation } from '@/[fsd]/features/skill/api';
import { toRunSettingsPayload } from '@/[fsd]/features/skill/lib/helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage } from '@/common/utils.jsx';

export const useCreateSkill = () => {
  const projectId = useSelectedProjectId();
  const { values, validateForm, setTouched, resetForm } = useFormikContext();
  const { toastError } = useToast();
  const [createSkill, { isLoading: isCreating }] = useSkillCreateMutation();

  const onCreate = useCallback(async () => {
    const validationErrors = await validateForm();
    if (Object.keys(validationErrors).length) {
      setTouched({ name: true, description: true, version_details: { instructions: true } });
      return null;
    }
    try {
      const result = await createSkill({
        projectId,
        name: values.name?.trim() || '',
        description: values.description?.trim() || '',
        versions: [
          {
            name: LATEST_VERSION_NAME,
            instructions: values.version_details?.instructions || '',
            tags: values.version_details?.tags || [],
            meta: values.version_details?.meta || {},
            run_settings: toRunSettingsPayload(values.version_details?.run_settings),
          },
        ],
      }).unwrap();
      resetForm({ values });
      return result;
    } catch (e) {
      toastError(buildErrorMessage(e));
      return null;
    }
  }, [createSkill, projectId, resetForm, setTouched, toastError, validateForm, values]);

  return { onCreate, isCreating };
};
