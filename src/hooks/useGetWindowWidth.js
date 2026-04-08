import { useCallback, useEffect, useState } from 'react';

export default function useGetWindowWidth() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const onSize = useCallback(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    onSize();
    window.addEventListener('resize', onSize);
    return () => {
      window.removeEventListener('resize', onSize);
    };
  }, [onSize]);

  return { windowWidth };
}
