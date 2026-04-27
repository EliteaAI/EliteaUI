import { useCallback, useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch, useSelector } from 'react-redux';

import { alitaApi } from '@/api/alitaApi';
import { actions } from '@/slices/applications';

import { useSelectedProjectId } from '../useSelectedProject';

export default function useRefetchAgentDetails() {
  const dispatch = useDispatch();
  const { values } = useFormikContext();
  const selectedProjectId = useSelectedProjectId();
  const { shouldRefetchDetails } = useSelector(state => state.applications);
  const updateDataRef = useRef(null);
  const updateData = useCallback(() => {
    if (shouldRefetchDetails) {
      dispatch(
        alitaApi.util.updateQueryData(
          'applicationDetails',
          { applicationId: values?.id, projectId: selectedProjectId },
          () => {
            return {
              ...values,
            };
          },
        ),
      );
      dispatch(actions.setShouldRefetchDetails(false));
    }
  }, [dispatch, selectedProjectId, shouldRefetchDetails, values]);

  useEffect(() => {
    updateDataRef.current = updateData;
  }, [updateData]);

  useEffect(() => {
    return () => {
      updateDataRef.current();
    };
  }, []);
}

export const useSetRefetchDetails = () => {
  const dispatch = useDispatch();
  const setRefetch = useCallback(() => {
    dispatch(actions.setShouldRefetchDetails(true));
  }, [dispatch]);
  return { setRefetch };
};
