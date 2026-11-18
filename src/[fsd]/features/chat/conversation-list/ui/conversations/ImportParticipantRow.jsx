import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { IMPORT_PARTICIPANT_STATUSES } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import {
  getParticipantStatusText,
  isParticipantLinkable,
} from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { Checkbox } from '@/[fsd]/shared/ui';

const ImportParticipantRow = memo(props => {
  const { participant, participants, checked, disabled, onToggle } = props;

  const linkable = isParticipantLinkable(participant);
  const isWarning = participant.status === IMPORT_PARTICIPANT_STATUSES.nameOnly;
  const statusText = getParticipantStatusText(participant, participants);

  const handleChange = useCallback(() => onToggle(participant.id), [onToggle, participant.id]);

  const styles = importParticipantRowStyles();

  return (
    <Box
      sx={styles.row}
      data-testid="import-chat-modal-participant-row"
    >
      <Checkbox.BaseCheckbox
        size="small"
        checked={linkable && checked}
        disabled={!linkable || disabled}
        onChange={handleChange}
        inputProps={{ 'aria-label': participant.name }}
      />
      <Box sx={styles.text}>
        <Typography
          variant="bodySmall"
          sx={styles.name(linkable)}
          title={participant.name}
        >
          {participant.name}
        </Typography>
        {statusText && (
          <Typography
            variant="bodySmall"
            sx={styles.status(isWarning)}
            data-testid="import-chat-modal-participant-status"
          >
            {statusText}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

ImportParticipantRow.displayName = 'ImportParticipantRow';

/** @type {MuiSx} */
const importParticipantRowStyles = () => ({
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    minWidth: 0,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    paddingTop: '0.375rem',
  },
  name:
    linkable =>
    ({ palette }) => ({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: linkable ? palette.text.primary : palette.text.disabled,
    }),
  status:
    isWarning =>
    ({ palette }) => ({
      color: isWarning ? palette.warning.main : palette.text.secondary,
    }),
});

export default ImportParticipantRow;
