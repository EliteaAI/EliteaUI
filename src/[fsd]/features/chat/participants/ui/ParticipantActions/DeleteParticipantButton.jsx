import { memo, useCallback, useMemo, useState } from 'react';

import { Box, IconButton, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useParticipantName } from '@/[fsd]/features/chat/participants/lib/hooks';
import { ChatParticipantType } from '@/common/constants';
import AlertDialog from '@/components/AlertDialog';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const DeleteParticipantButton = memo(props => {
  const { disabled, participant, onDelete, sx, warningMessage } = props;

  const participantName = useParticipantName(participant);
  const theme = useTheme();

  const entityType = useMemo(() => {
    const name = participant?.entity_name;
    const agentType = participant?.entity_settings?.agent_type || participant?.agent_type;
    if (name === ChatParticipantType.Toolkits) return 'toolkit';
    if (name === ChatParticipantType.Pipelines) return 'pipeline';
    if (name === ChatParticipantType.Users) return 'user';
    if (name === ChatParticipantType.Applications) {
      return agentType === 'pipeline' ? 'pipeline' : 'agent';
    }
    return undefined;
  }, [participant?.agent_type, participant?.entity_name, participant?.entity_settings?.agent_type]);

  const removeLabel = `Remove ${entityType || 'participant'}`;

  const dialogTitle = useMemo(
    () => (
      <Box sx={styles.dialogTitleWrapper}>
        <Box
          component={AttentionIcon}
          sx={styles.attentionIcon}
        />
        {`${removeLabel}?`}
      </Box>
    ),
    [removeLabel],
  );

  const styledEntityName = useMemo(
    () => (
      <Typography
        component="span"
        variant="headingSmall"
        color={theme.palette.text.deleteAlertEntityName}
      >
        {participantName}
      </Typography>
    ),
    [participantName, theme.palette.text.deleteAlertEntityName],
  );

  const dialogContent = useMemo(() => {
    if (warningMessage) return warningMessage;
    if (!entityType)
      return `Are you sure to remove this participant ${participantName} from the conversation?`;
    return (
      <>
        Are you sure to remove the {styledEntityName} {entityType} from conversation?
      </>
    );
  }, [entityType, participantName, styledEntityName, warningMessage]);

  const [openAlert, setOpenAlert] = useState(false);

  const onClickDelete = useCallback(event => {
    event.stopPropagation();
    setOpenAlert(true);
  }, []);

  const onCloseAlert = useCallback(event => {
    event?.stopPropagation();
    setOpenAlert(false);
  }, []);

  const onConfirmAlert = useCallback(
    event => {
      event?.stopPropagation();
      onDelete(participant);
      setOpenAlert(false);
    },
    [onDelete, participant],
  );

  return (
    <>
      <Tooltip
        title={removeLabel}
        placement="top"
      >
        <IconButton
          disabled={disabled}
          onClick={onClickDelete}
          variant="elitea"
          color="tertiary"
          id="DeleteButton"
          sx={sx}
        >
          <DeleteIcon sx={styles.deleteIcon} />
        </IconButton>
      </Tooltip>
      <AlertDialog
        title={dialogTitle}
        alertContent={dialogContent}
        open={openAlert}
        alarm
        onClose={onCloseAlert}
        onCancel={onCloseAlert}
        onConfirm={onConfirmAlert}
        confirmButtonText="Remove"
      />
    </>
  );
});

DeleteParticipantButton.displayName = 'DeleteParticipantButton';

/** @type {MuiSx} */
const styles = {
  deleteIcon: {
    fontSize: '1rem',
  },
  dialogTitleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
  },
  attentionIcon: {
    width: '1.125rem',
    height: '1.125rem',
    fill: theme => theme.palette.icon.fill.attention,
  },
};

export default DeleteParticipantButton;
