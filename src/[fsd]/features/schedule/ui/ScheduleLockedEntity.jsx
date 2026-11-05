import { memo } from 'react';

import { Link } from 'react-router-dom';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Box, Typography } from '@mui/material';

import { TRIGGER_KIND, toKindNoun } from '@/[fsd]/entities/schedule';
import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';
import RouteDefinitions from '@/routes';

const TYPE_LABEL = { agent: 'Agent', pipeline: 'Pipeline' };

/**
 * The agent or pipeline of a form opened from its own editor: shown, not changeable.
 * `editing` words the hint for a saved schedule.
 */
const ScheduleLockedEntity = memo(props => {
  const { type, name, editing = false, isWebhook = false } = props;
  const noun = toKindNoun(isWebhook ? TRIGGER_KIND.webhook : TRIGGER_KIND.cron);

  const label = TYPE_LABEL[type] ?? 'Agent';
  const lowerLabel = label.toLowerCase();
  const styles = scheduleLockedEntityStyles();

  return (
    <Box data-testid="schedule-locked-entity">
      <Box sx={styles.field}>
        <StyledInputEnhancer
          disabled
          required
          label={label}
          value={name ?? ''}
          sx={styles.input}
        />
        <LockOutlinedIcon
          fontSize="small"
          sx={styles.lock}
        />
      </Box>
      <Typography
        variant="bodySmall"
        color="text.secondary"
        sx={styles.hint}
      >
        {editing
          ? `To change the ${lowerLabel}, create a new ${noun} in `
          : `To ${isWebhook ? 'start' : 'schedule'} a different ${lowerLabel}, create the ${noun} in `}
        <Box
          component={Link}
          to={isWebhook ? RouteDefinitions.Webhooks : RouteDefinitions.Schedules}
          data-testid="schedule-locked-entity-link"
          sx={styles.link}
        >
          {isWebhook ? 'Settings / Webhooks' : 'Settings / Schedules'}
        </Box>
        .
      </Typography>
    </Box>
  );
});

ScheduleLockedEntity.displayName = 'ScheduleLockedEntity';

/** @type {MuiSx} */
const scheduleLockedEntityStyles = () => ({
  field: { position: 'relative' },
  // a disabled field dims its label and text; the mockup keeps them at the normal tone
  input: ({ palette }) => ({
    '& .MuiInputLabel-root, & .MuiInputLabel-root.Mui-disabled': { color: palette.text.primary },
    '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: palette.text.secondary },
  }),
  lock: ({ palette }) => ({
    position: 'absolute',
    right: '0.25rem',
    bottom: '0.5rem',
    color: palette.icon.default,
    pointerEvents: 'none',
  }),
  hint: { display: 'block', marginTop: '0.25rem' },
  link: ({ palette }) => ({ color: palette.text.secondary, textDecoration: 'underline' }),
});

export default ScheduleLockedEntity;
