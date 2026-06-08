import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Switch } from '@/[fsd]/shared/ui';

const EnableToggleCard = memo(props => {
  const { enabled, onToggle, disabled = false } = props;
  const styles = enableToggleCardStyles();
  return (
    <Box sx={styles.toggleCard}>
      <Box sx={styles.toggleCardText}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Project Context
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.toggleDescription}
        >
          Project-specific background information that the AI uses to generate more accurate and relevant
          responses, tailored to your workflows, data, and goals.
        </Typography>
      </Box>
      <Switch.BaseSwitch
        checked={enabled}
        onChange={onToggle}
        color="primary"
        disabled={disabled}
      />
    </Box>
  );
});

EnableToggleCard.displayName = 'EnableToggleCard';
export default EnableToggleCard;

/** @type {MuiSx} */
const enableToggleCardStyles = () => ({
  toggleCard: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.userInputBackground,
    gap: '1rem',
  }),
  toggleCardText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  toggleDescription: ({ palette }) => ({
    color: palette.text.primary,
  }),
});
