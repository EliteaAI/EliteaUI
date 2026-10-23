import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { useProjectContextWindowMode } from '@/[fsd]/features/settings/lib/hooks';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const NO_PERMISSION = 'Only project admins can change the context window for new chats.';

const ContextWindowSettings = memo(() => {
  const styles = contextWindowSettingsStyles();
  const { checkPermission } = useCheckPermission();
  const { mode, saveMode, saving } = useProjectContextWindowMode();
  const canEdit = checkPermission(PERMISSIONS.configuration.update);

  return (
    <Box
      sx={styles.card}
      data-testid="context-window-settings-card"
    >
      <Box sx={styles.text}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Context window for new chats
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.description}
        >
          Default for chats created in this project. Each chat can switch between Balanced and Full.
        </Typography>
      </Box>
      <ContextBudgetUI.ContextWindowModeSelector
        value={mode}
        onChange={saveMode}
        disabled={!canEdit || saving}
        disabledReason={!canEdit ? NO_PERMISSION : undefined}
      />
    </Box>
  );
});

ContextWindowSettings.displayName = 'ContextWindowSettings';

/** @type {MuiSx} */
const contextWindowSettingsStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.surface.interactive.default,
    gap: '1rem',
  }),
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  description: ({ palette }) => ({
    color: palette.text.primary,
  }),
});

export default ContextWindowSettings;
