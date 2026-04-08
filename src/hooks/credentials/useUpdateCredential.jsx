import { useCallback } from 'react';

import { useUpdateConfigurationMutation } from '@/api/configurations';
import { isNullOrUndefined } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const VALUE_OR_NULL_FIELDS = ['port'];

const getRequestBody = ({ configurationKeys, settings, originalConfiguration }) => {
  const data = {};

  configurationKeys.forEach(key => {
    if (settings[key] !== undefined) {
      if (
        typeof settings[key] === 'object' &&
        settings[key] !== null &&
        Object.prototype.hasOwnProperty.call(settings[key], 'value')
      ) {
        data[key] = settings[key].value;
      } else {
        if (VALUE_OR_NULL_FIELDS.includes(key) && !settings[key]) data[key] = null;
        else data[key] = settings[key];
      }
    }
  });

  const elitea_title =
    settings?.elitea_title ||
    `updated_configurartion_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`;

  const body = {
    elitea_title,
    label: settings.label || '',
    data,
  };

  if (originalConfiguration?.meta) {
    body.meta = originalConfiguration.meta;
  }

  if (originalConfiguration?.shared !== undefined) {
    body.shared = !isNullOrUndefined(settings.shared) ? settings.shared : originalConfiguration.shared;
  }

  return body;
};

export const useUpdateCredential = (formik, editToolDetail, configurationKeys) => {
  const currentProjectId = useSelectedProjectId();
  const [updateConfiguration, { error, isLoading, isError }] = useUpdateConfigurationMutation();

  const update = useCallback(async () => {
    const body = getRequestBody({
      configurationKeys,
      settings: editToolDetail?.settings,
      originalConfiguration: formik.values,
    });

    return updateConfiguration({
      configId: formik.values?.id,
      projectId: currentProjectId,
      body,
    }).then(response => {
      return response;
    });
  }, [updateConfiguration, currentProjectId, formik.values, configurationKeys, editToolDetail?.settings]);

  return {
    update,
    error,
    isLoading,
    isError,
  };
};
