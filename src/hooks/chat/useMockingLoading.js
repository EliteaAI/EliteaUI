import { useEffect, useState } from 'react';

const useMockingLoading = ({ isPlayback }) => {
  const [isMockingLoading, setIsMockingLoading] = useState(isPlayback);
  useEffect(() => {
    if (isPlayback) {
      setTimeout(() => {
        setIsMockingLoading(false);
      }, 2000);
    }
  }, [isPlayback]);

  return {
    isMockingLoading,
  };
};
export default useMockingLoading;
