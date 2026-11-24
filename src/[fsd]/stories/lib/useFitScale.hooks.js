import { useEffect, useState } from 'react';

const getScale = (size, count, gap, labelHeight) =>
  Math.min(
    1,
    (window.innerWidth - gap * (count + 1)) / (size.width * count),
    (window.innerHeight - gap * 3 - labelHeight) / size.height,
  );

// Scale that fits `count` frames of `size` side by side, each under a label, in the window
export const useFitScale = (size, count, gap, labelHeight) => {
  const [scale, setScale] = useState(() => getScale(size, count, gap, labelHeight));

  useEffect(() => {
    const handleResize = () => setScale(getScale(size, count, gap, labelHeight));
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size, count, gap, labelHeight]);

  return scale;
};
