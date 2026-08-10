import { memo, useEffect, useRef, useState } from 'react';

import { Box } from '@mui/material';

import ProjectAvatar from './ProjectAvatar';

const LazyProjectAvatar = memo(({ projectName, projectId, size = '2rem' }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '6.25rem' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{ width: size, height: size, minWidth: size, display: 'inline-flex' }}
    >
      <ProjectAvatar
        projectName={projectName}
        projectId={isVisible ? projectId : undefined}
        fields="icon_meta"
        size={size}
      />
    </Box>
  );
});

LazyProjectAvatar.displayName = 'LazyProjectAvatar';

export default LazyProjectAvatar;
