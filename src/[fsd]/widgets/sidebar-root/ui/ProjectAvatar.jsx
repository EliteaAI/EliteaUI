import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { useProjectInfoQuery } from '@/[fsd]/features/settings';
import { getProjectAvatarColor } from '@/[fsd]/widgets/sidebar-root/lib/helpers';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

const ProjectAvatar = memo(props => {
  const { projectName, projectId, iconMeta: iconMetaProp, size = '2rem', fields } = props;

  const { data: projectInfo } = useProjectInfoQuery(
    { projectId, fields },
    { skip: !projectId || !!iconMetaProp || projectId === PUBLIC_PROJECT_ID },
  );

  const iconMeta = iconMetaProp || projectInfo?.icon_meta;

  const letter = useMemo(() => {
    return (projectName || '?')[0].toUpperCase();
  }, [projectName]);

  const backgroundColor = useMemo(() => {
    return getProjectAvatarColor(projectName);
  }, [projectName]);

  const styles = projectAvatarStyles(size, backgroundColor);

  if (iconMeta?.url) {
    return (
      <Box
        component="img"
        src={iconMeta.url}
        alt={projectName}
        sx={styles.image}
      />
    );
  }

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

/** @type {MuiSx} */
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
  image: {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  letter: ({ palette }) => ({
    color: palette.text.white,
    fontFamily: 'Montserrat, sans-serif',
    fontSize: `calc(${size} * 0.375)`,
    fontWeight: 500,
    lineHeight: 1,
    userSelect: 'none',
  }),
});

export default ProjectAvatar;
