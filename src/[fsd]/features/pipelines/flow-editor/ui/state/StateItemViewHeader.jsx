import { memo } from 'react';

import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import { Box, IconButton, Typography } from '@mui/material';

const StateItemViewHeader = memo(props => {
  const { title, onFullScreen, testId } = props;

  const styles = stateItemViewHeaderStyles();

  return (
    <Box sx={styles.container}>
      <Typography
        variant="labelMedium"
        color="text.default"
      >
        {title}
      </Typography>
      <IconButton
        sx={styles.iconButton}
        variant="elitea"
        color="tertiary"
        onClick={onFullScreen}
        data-testid={testId}
      >
        <FullscreenOutlinedIcon sx={styles.icon} />
      </IconButton>
    </Box>
  );
});

StateItemViewHeader.displayName = 'StateItemViewHeader';

/** @type {MuiSx} */
const stateItemViewHeaderStyles = () => ({
  container: {
    display: 'flex',
    height: '1.75rem',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconButton: {
    marginLeft: 0,
  },
  icon: {
    fontSize: '1.3125rem',
  },
});

export default StateItemViewHeader;
