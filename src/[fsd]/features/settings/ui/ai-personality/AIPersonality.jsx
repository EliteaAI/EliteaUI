import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import SettingsFormProvider from '@/[fsd]/features/settings/ui/shared/SettingsFormProvider';

import AIPersonalityFormContent from './AIPersonalityFormContent';

const AIPersonality = memo(() => {
  const styles = aiPersonalityStyles();

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          AI Personality
        </Typography>
      </Box>
      <Box sx={styles.content}>
        <SettingsFormProvider FormContent={AIPersonalityFormContent} />
      </Box>
    </Box>
  );
});

AIPersonality.displayName = 'AIPersonality';

/** @type {MuiSx} */
const aiPersonalityStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  header: ({ palette }) => ({
    height: '3.75rem',
    minHeight: '3.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  content: ({ palette }) => ({
    backgroundColor: palette.background.tabPanel,
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  }),
});

export default AIPersonality;
