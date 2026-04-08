/* eslint-disable */
import { useCallback } from 'react';

import { useToolkitCreateMutation } from '@/api/toolkits';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const useCreateToolkit = formik => {
  const projectId = useSelectedProjectId();
  const [createRequest, { data, error, isLoading, isError }] = useToolkitCreateMutation();

  const create = useCallback(async () => {
    //@todo: remove after dev completion - easier to track data before BE submit
    // console.log('formik.values', formik.values);
    // console.log('formik.values', formik.values.version_details.tools[0]);

    //@todo: need to be modified due to possible changing of Formik data structure
    const newTool = formik?.values;

    //@todo: need to handle errors from BE taking into account the response
    return createRequest({
      projectId,
      ...newTool,
    }).then(data => {
      return data;
    });
  }, [createRequest, projectId, formik.values]);

  return {
    isLoading,
    create,
    error,
    isError,
  };
};

export default useCreateToolkit;
