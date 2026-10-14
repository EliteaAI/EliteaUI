import { memo } from 'react';

import { Button, Tooltip, Typography, useTheme } from '@mui/material';

import SettingIcon from '@/components/Icons/SettingIcon';

const ParticipantSettingsButton = memo(props => {
  const { tooltip, isEditing, canEdit, disabled, onClick, testId, ariaLabel } = props;
  const theme = useTheme();
  const styles = participantSettingsButtonStyles();

  return (
    <Tooltip
      placement="top"
      title={tooltip}
    >
      <Button
        data-testid={testId}
        size="small"
        aria-label={ariaLabel}
        aria-haspopup="settings"
        onClick={onClick}
        disabled={disabled}
        variant="elitea"
        color="secondary"
      >
        {isEditing ? (
          <Typography
            variant="labelSmall"
            color="primary"
            sx={styles.editingText}
          >
            {canEdit ? 'Editing...' : 'Viewing...'}
          </Typography>
        ) : (
          <SettingIcon
            sx={styles.settingIcon}
            fill={disabled ? theme.palette.icon.disabled : undefined}
          />
        )}
      </Button>
    </Tooltip>
  );
});

ParticipantSettingsButton.displayName = 'ParticipantSettingsButton';

/** @type {MuiSx} */
const participantSettingsButtonStyles = () => ({
  editingText: {
    fontSize: '.75rem',
    fontWeight: 400,
  },
  settingIcon: {
    fontSize: '1rem',
  },
});

export default ParticipantSettingsButton;
