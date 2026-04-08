import { memo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import InfoIcon from '@/components/Icons/InfoIcon';

const EmptyMcpTools = memo(() => {
  const styles = getStyles();
  const theme = useTheme();
  return (
    <Box sx={styles.container}>
      <Box sx={styles.infoIconWrapper}>
        <InfoIcon
          width={14}
          height={14}
          fill={theme.palette.icon.fill.tips}
        />
      </Box>
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        No tools to display for now. To get tools from MCP press button “Load Tools”
      </Typography>
    </Box>
  );
});

const getStyles = () => ({
  infoIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    width: '0.875rem',
    height: '0.875rem',
  },
  container: ({ palette }) => ({
    marginTop: '0.75rem',
    display: 'flex',
    boxSizing: 'border-box',
    alignItems: 'center',
    minHeight: '2.5rem',
    width: '100%',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    border: `0.0625rem solid ${palette.border.tips}`,
    borderRadius: '0.5rem',
    background: palette.background.tips,
  }),
  text: ({ palette }) => ({
    color: palette.text.tips,
  }),
});

EmptyMcpTools.displayName = 'EmptyMcpTools';

export default EmptyMcpTools;
