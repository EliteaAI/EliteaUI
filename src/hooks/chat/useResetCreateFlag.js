import { useCallback } from 'react';

import { useSearchParams } from 'react-router-dom';

const useResetCreateFlag = () => {
  const [, setSearchParams] = useSearchParams();

  const resetCreateFlag = useCallback(() => {
    const newSearchParams = new URLSearchParams({});
    setSearchParams(newSearchParams, {
      replace: true,
    });
  }, [setSearchParams]);

  return { resetCreateFlag };
};

export default useResetCreateFlag;
