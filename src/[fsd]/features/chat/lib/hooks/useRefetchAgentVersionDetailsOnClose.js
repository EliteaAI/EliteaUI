import { useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { actions } from '@/slices/applications';

const useRefetchAgentVersionDetailsOnClose = ({ refetchVersionDetails }) => {
  const dispatch = useDispatch();
  const { shouldRefetchDetails } = useSelector(state => state.applications);

  const refetchAgentVersionDetailsOnClose = useCallback(() => {
    if (shouldRefetchDetails) {
      refetchVersionDetails?.();
      dispatch(actions.setShouldRefetchDetails(false));
    }
  }, [dispatch, refetchVersionDetails, shouldRefetchDetails]);

  return { refetchAgentVersionDetailsOnClose };
};

export default useRefetchAgentVersionDetailsOnClose;
