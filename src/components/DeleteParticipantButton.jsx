import { useCallback, useMemo, useState } from 'react';

import { IconButton, Typography, useTheme } from '@mui/material';

import { ChatParticipantType } from '@/common/constants';
import AlertDialog from '@/components/AlertDialog';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import useParticipantName from '@/hooks/chat/useParticipantName';

const DeleteParticipantButton = ({ disabled, participant, onDelete, sx, warningMessage }) => {
  const participantName = useParticipantName(participant);
  const theme = useTheme();

  // Derive entity type consistent with Participants UI logic
  const entityType = useMemo(() => {
    const name = participant?.entity_name;
    const agentType = participant?.entity_settings?.agent_type || participant?.agent_type;
    if (name === ChatParticipantType.Toolkits) return 'toolkit';
    if (name === ChatParticipantType.Pipelines) return 'pipeline';
    if (name === ChatParticipantType.Users) return 'user';
    if (name === ChatParticipantType.Applications) {
      return agentType === 'pipeline' ? 'pipeline' : 'agent';
    }
    return undefined; // fall back to generic participant behavior
  }, [participant?.agent_type, participant?.entity_name, participant?.entity_settings?.agent_type]);

  const dialogTitle = useMemo(() => {
    if (!warningMessage) {
      switch (entityType) {
        case 'agent':
          return 'Remove agent?';
        case 'pipeline':
          return 'Remove pipeline?';
        case 'toolkit':
          return 'Remove toolkit?';
        case 'user':
          return 'Remove user?';
        default:
          return 'Remove participant?';
      }
    }
    // keep existing title when a custom warningMessage is supplied by caller
    return 'Remove participant?';
  }, [entityType, warningMessage]);

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
    switch (entityType) {
      case 'agent':
        return <>Are you sure to remove the {styledEntityName} agent?</>;
      case 'pipeline':
        return <>Are you sure to remove the {styledEntityName} pipeline?</>;
      case 'toolkit':
        return <>Are you sure to remove the {styledEntityName} toolkit?</>;
      case 'user':
        return <>Are you sure to remove the {styledEntityName} user?</>;
      default:
        return `Are you sure to remove this participant ${participantName} from the conversation?`;
    }
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
      <IconButton
        disabled={disabled}
        onClick={onClickDelete}
        variant="elitea"
        color="tertiary"
        id="DeleteButton"
        sx={sx}
      >
        <DeleteIcon sx={{ fontSize: '16px' }} />
      </IconButton>
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
};

export default DeleteParticipantButton;
