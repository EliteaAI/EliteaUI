import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { getProjectAvatarColor } from '@/[fsd]/widgets/sidebar-root/lib/helpers';

const ProjectAvatar = memo(props => {
  const { projectName, size = '2rem' } = props;

  const letter = useMemo(() => {
    return (projectName || '?')[0].toUpperCase();
  }, [projectName]);

  const backgroundColor = useMemo(() => {
    return getProjectAvatarColor(projectName);
  }, [projectName]);

  const styles = projectAvatarStyles(size, backgroundColor);

  return (
    <Box sx={styles.container}>
      <Typography
        component="span"
        sx={styles.letter}
      >
        {letter}
      </Typography>
    </Box>
  );
});

ProjectAvatar.displayName = 'ProjectAvatar';

const projectAvatarStyles = (size, backgroundColor) => ({
  container: {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${backgroundColor}, ${backgroundColor}4D)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '0.75rem',
    userSelect: 'none',
  },
});

export default ProjectAvatar;
