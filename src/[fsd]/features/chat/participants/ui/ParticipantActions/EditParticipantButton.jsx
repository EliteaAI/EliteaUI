import { memo } from 'react';

import { IconButton, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { ParticipantEditPermissionMap } from '@/[fsd]/features/chat/participants/lib/constants/participant.constants';
import { usePublicProjectAccessCheck } from '@/[fsd]/features/project/lib/hooks';
import EditPenIcon from '@/components/Icons/EditPenIcon';
import SettingIcon from '@/components/Icons/SettingIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

const EditParticipantButton = memo(props => {
  const {
    participant,
    onEdit,
    disabled = false,
    id = 'EditButton',
    sx = {},
    tooltip = 'Edit',
    placement = 'top',
    isPublic,
  } = props;

  const theme = useTheme();

  const hasPublicProjectAccess = usePublicProjectAccessCheck();
  const { checkPermission } = useCheckPermission();

  const hasPermission = checkPermission(ParticipantEditPermissionMap[participant.entity_name]);
  const canEdit = (!isPublic && hasPermission) || (isPublic && hasPublicProjectAccess);

  const handleEdit = event => {
    event.stopPropagation();
    onEdit?.(participant);
  };

  return (
    <Tooltip
      title={!canEdit ? 'View settings' : tooltip}
      placement={placement}
    >
      <IconButton
        onClick={handleEdit}
        disabled={disabled}
        variant="elitea"
        color="tertiary"
        id={id}
        sx={[styles.listItemIcon, sx]}
      >
        {canEdit ? (
          <EditPenIcon sx={{ fontSize: '1rem' }} />
        ) : (
          <SettingIcon
            sx={{ fontSize: '1rem' }}
            fill={disabled ? theme.palette.icon.fill.disabled : undefined}
          />
        )}
      </IconButton>
    </Tooltip>
  );
});

const styles = {
  listItemIcon: ({ palette }) => ({
    fill: palette.text.primary,
  }),
};

EditParticipantButton.displayName = 'EditParticipantButton';

export default EditParticipantButton;
