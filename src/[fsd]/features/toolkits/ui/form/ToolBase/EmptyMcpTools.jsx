import { memo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

const EmptyMcpTools = memo(() => {
  const theme = useTheme();
  const styles = getStyles(theme);
  return (
    <Box
      sx={styles.container}
      data-testid="toolkit-tools-empty-state"
    >
      <InfoTooltip
        infoTooltip={{ icon: styles.info }}
        disableTooltip
      />
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        No tools to display for now. To get tools from MCP press button “Load Tools”
      </Typography>
    </Box>
  );
});

const getStyles = theme => ({
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
  info: {
    width: 14,
    height: 14,
    fill: theme.palette.icon.fill.tips,
  },
  text: ({ palette }) => ({
    color: palette.text.tips,
  }),
});

EmptyMcpTools.displayName = 'EmptyMcpTools';

export default EmptyMcpTools;
