import { memo, useCallback, useMemo, useState } from 'react';

import { IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useParticipantName } from '@/[fsd]/features/chat/participants/lib/hooks';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { isMcpToolkitType } from '@/[fsd]/shared/lib/helpers';
import { Modal } from '@/[fsd]/shared/ui';
import { ChatParticipantType } from '@/common/constants';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const DeleteParticipantButton = memo(props => {
  const { disabled, participant, onDelete, sx, warningMessage } = props;

  const participantName = useParticipantName(participant);

  const entityType = useMemo(() => {
    const name = participant?.entity_name;
    const agentType = participant?.entity_settings?.agent_type || participant?.agent_type;
    const toolkitType = participant?.entity_settings?.toolkit_type;
    const isMcp = participant?.meta?.mcp === true || isMcpToolkitType(toolkitType);

    if (name === ChatParticipantType.Toolkits) {
      return isMcp ? 'MCP' : 'toolkit';
    }
    if (name === ChatParticipantType.Pipelines) return 'pipeline';
    if (name === ChatParticipantType.Users) return 'user';
    if (name === ChatParticipantType.Applications) {
      return agentType === 'pipeline' ? 'pipeline' : 'agent';
    }
    return undefined;
  }, [
    participant?.agent_type,
    participant?.entity_name,
    participant?.entity_settings?.agent_type,
    participant?.entity_settings?.toolkit_type,
    participant?.meta?.mcp,
  ]);

  const removeLabel = `Remove ${entityType || 'participant'}`;

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

  const dialogTitle = `Remove ${entityType || 'participant'}?`;

  const textContent = warningMessage || 'Are you sure to remove the ';
  const inlineExtraContent = warningMessage ? '' : ` ${entityType || 'participant'} from chat?`;

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
          data-testid="chat-participant-remove-button"
        >
          <DeleteIcon sx={styles.deleteIcon} />
        </IconButton>
      </Tooltip>
      <Modal.DeleteEntityModal
        open={openAlert}
        onClose={onCloseAlert}
        onConfirm={onConfirmAlert}
        title={dialogTitle}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        textContent={textContent}
        name={warningMessage ? '' : participantName}
        inlineExtraContent={inlineExtraContent}
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
};

export default DeleteParticipantButton;
