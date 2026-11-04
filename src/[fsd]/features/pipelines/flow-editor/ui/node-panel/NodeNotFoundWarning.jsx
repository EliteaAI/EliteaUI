import { memo } from 'react';

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Typography } from '@mui/material';

const NodeNotFoundWarning = memo(props => {
  const { message, 'data-testid': dataTestId } = props;

  const styles = nodeNotFoundWarningStyles();

  return (
    <Box
      sx={styles.root}
      data-testid={dataTestId}
    >
      <WarningAmberIcon
        fontSize="small"
        sx={styles.icon}
      />
      <Typography
        variant="caption"
        sx={styles.text}
      >
        {message}
      </Typography>
    </Box>
  );
});

NodeNotFoundWarning.displayName = 'NodeNotFoundWarning';

/** @type {MuiSx} */
const nodeNotFoundWarningStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.375rem',
    padding: '.375rem .75rem',
    borderRadius: '.375rem',
    backgroundColor: palette.background.warning,
    border: `0.0625rem solid ${palette.border.attention}`,
    width: '100%',
    boxSizing: 'border-box',
  }),
  icon: ({ palette }) => ({
    flexShrink: 0,
    color: palette.icon.warning,
  }),
  text: ({ palette }) => ({
    color: palette.text.attention,
  }),
});

export default NodeNotFoundWarning;
