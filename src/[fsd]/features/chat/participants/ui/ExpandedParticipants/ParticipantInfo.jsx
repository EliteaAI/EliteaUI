import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import InfoIcon from '@/components/Icons/InfoIcon';

/**
 * Informational (NOT error) hint shown on a participant card when a "container" agent — one that
 * itself uses other agents — is attached to a chat but is not the active agent (issue #5680).
 *
 * In adhoc chat (the base model is the orchestrator) such an agent is intentionally NOT bound as a
 * callable tool: nesting it under the chat model would be an unsupported extra level. It runs only
 * when selected as the active agent. Without this hint the skip looks like a silent no-op / bug;
 * with it, the card explains the behavior and how to run the agent. Styled neutrally (info, not the
 * red attention style used for genuine errors) so a correct configuration never reads as broken.
 */
const ParticipantInfo = memo(() => {
  const styles = participantInfoStyles();

  return (
    <Box sx={styles.infoRow}>
      <Box sx={styles.infoIcon}>
        <InfoIcon />
      </Box>
      <Typography
        variant="bodySmall"
        color="text.secondary"
        sx={styles.infoMessage}
      >
        Uses other agents — runs only as the active agent. Select it to run; it won&apos;t be used as a tool.
      </Typography>
    </Box>
  );
});

ParticipantInfo.displayName = 'ParticipantInfo';

/** @type {MuiSx} */
const participantInfoStyles = () => ({
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '.375rem',
    padding: '0 .75rem .25rem',
  },
  infoIcon: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '1rem',
    height: '1rem',
    marginTop: '.0625rem',
    '& path': {
      fill: palette.icon.fill.secondary,
    },
  }),
  infoMessage: {
    lineHeight: 1.3,
  },
});

export default ParticipantInfo;
