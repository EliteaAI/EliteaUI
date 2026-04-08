import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const AIAssistantPanelHeader = memo(({ title, actions }) => {
  const styles = aiAssistantPanelHeaderStyles();

  return (
    <Box sx={styles.panelHeader}>
      <Typography
        variant="labelSmall"
        color="text.secondary"
        sx={styles.panelTitle}
      >
        {title}
      </Typography>
      <Box sx={styles.headerActions}>{actions}</Box>
    </Box>
  );
});

AIAssistantPanelHeader.displayName = 'AIAssistantPanelHeader';

/** @type {MuiSx} */
const aiAssistantPanelHeaderStyles = () => ({
  panelHeader: ({ spacing, palette }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: spacing(5.5),
    gap: spacing(1.25),
    padding: spacing(0.75, 3),
    borderBottom: `.0625rem solid ${palette.border.lines}`,
  }),
  panelTitle: ({ typography, palette }) => ({
    ...typography.subtitle,
    color: palette.secondary.main,
  }),
  headerActions: ({ spacing }) => ({
    display: 'flex',
    gap: spacing(1.5),
    alignItems: 'center',
  }),
});

export default AIAssistantPanelHeader;
