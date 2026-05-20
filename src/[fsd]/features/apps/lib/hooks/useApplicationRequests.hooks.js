import { useCallback, useState } from 'react';

export const REQUEST_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const useApplicationRequests = () => {
  const [requests, setRequests] = useState({});

  const submitRequest = useCallback((appType, reason) => {
    setRequests(prev => ({
      ...prev,
      [appType]: { status: REQUEST_STATUS.PENDING, reason },
    }));
  }, []);

  const getRequestStatus = useCallback(
    appType => requests[appType]?.status || REQUEST_STATUS.NONE,
    [requests],
  );

  const setStatus = useCallback((appType, status) => {
    setRequests(prev => ({
      ...prev,
      [appType]: { ...prev[appType], status },
    }));
  }, []);

  return { submitRequest, getRequestStatus, setStatus, REQUEST_STATUS };
};
