import { useEffect, useRef, useState } from 'react';

export default function useGetComponentHeight() {
  const componentRef = useRef(null);
  const [componentHeight, setComponentHeight] = useState(0);

  useEffect(() => {
    setComponentHeight(componentRef.current?.offsetHeight || 0);
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setComponentHeight(entry.contentRect.height);
      }
    });

    if (componentRef.current) {
      resizeObserver.observe(componentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return {
    componentRef,
    componentHeight,
  };
}
