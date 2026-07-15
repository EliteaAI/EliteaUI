import { memo } from 'react';

import { Box } from '@mui/material';

const ProjectIconItem = memo(props => {
  const { isSelected, children, onClick } = props;

  const styles = projectIconItemStyles(isSelected);

  return (
    <Box
      onClick={onClick}
      sx={styles.container}
    >
      {children}
    </Box>
  );
});

ProjectIconItem.displayName = 'ProjectIconItem';

/** @type {MuiSx} */
const projectIconItemStyles = isSelected => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '3.5rem',
    width: '3.5rem',
    borderRadius: '0.5rem',
    border: `${isSelected ? 1 : 0}px solid ${palette.primary.main}`,
    background: isSelected ? palette.background.icon?.default : 'transparent',

    '&:hover': {
      border: `1px solid ${palette.border.flowNode}`,
      background: palette.background.icon?.default,
    },
    cursor: 'pointer',
  }),
});

export default ProjectIconItem;
