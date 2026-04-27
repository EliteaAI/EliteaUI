import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useCreateConfigurationMutation } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const getRequestBody = ({ toolType, configurationKeys, settings }) => {
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
        data[key] = settings[key];
      }
    }
  });

  const title =
    settings?.alita_title || `${toolType}_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`;

  const body = {
    alita_title: title,
    label: settings.label || '',
    type: toolType,
    data,
    shared: settings.shared || false,
  };

  return body;
};

export const useCreateCredential = (formik, editToolDetail, configurationKeys) => {
  const currentProjectId = useSelectedProjectId();
  const [searchParams] = useSearchParams();
  const projectIdFromParams = searchParams.get('project_id');
  const [createConfiguration, { error, isLoading, isError }] = useCreateConfigurationMutation();

  const toolType = useMemo(() => editToolDetail?.type || '', [editToolDetail?.type]);

  const create = useCallback(async () => {
    const body = getRequestBody({
      toolType,
      configurationKeys: configurationKeys || [],
      settings: editToolDetail?.settings || {},
    });

    return createConfiguration({
      projectId: projectIdFromParams || currentProjectId,
      body,
    }).then(response => {
      return response;
    });
  }, [
    createConfiguration,
    currentProjectId,
    toolType,
    configurationKeys,
    editToolDetail?.settings,
    projectIdFromParams,
  ]);

  return {
    create,
    error,
    isLoading,
    isError,
  };
};
