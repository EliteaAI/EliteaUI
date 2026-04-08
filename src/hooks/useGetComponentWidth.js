import { useEffect, useRef, useState } from 'react';

export default function useGetComponentWidth() {
  const componentRef = useRef(null);
  const [componentWidth, setComponentWidth] = useState(0);

  useEffect(() => {
    setComponentWidth(componentRef.current?.offsetWidth || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentRef.current]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setComponentWidth(entry.contentRect.width);
      }
    });

    if (componentRef.current) {
      resizeObserver.observe(componentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentRef.current]);

  return {
    componentRef,
    componentWidth,
  };
}
