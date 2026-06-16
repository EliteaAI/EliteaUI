import { memo, useCallback, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';

import { useSkillExport } from '@/[fsd]/features/skill/lib/useSkillExport';
import { useDeleteConfirmationDisabled } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { useDeleteSkillMutation } from '@/api/skills';
import PublishIcon from '@/assets/publish-icon.svg?react';
import { SkillsTabs } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils.jsx';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DotsMenuIcon from '@/components/Icons/DotsMenuIcon';
import ExportIcon from '@/components/Icons/ExportIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

const PUBLISH_DISABLED_TOOLTIP = 'Available in future release';

const BasicMenuItem = memo(props => {
  const { icon, label, onClick, disabled } = props;
  const styles = basicMenuItemStyles();

  return (
    <MenuItem
      onClick={onClick}
      sx={styles.menuItem}
      disabled={disabled}
    >
      {icon}
      <Typography variant="labelMedium">{label}</Typography>
    </MenuItem>
  );
});

BasicMenuItem.displayName = 'SkillBasicMenuItem';

const DisabledPublishMenuItem = memo(() => {
  const styles = basicMenuItemStyles();

  return (
    <Tooltip
      title={PUBLISH_DISABLED_TOOLTIP}
      placement="left"
      arrow
    >
      <span>
        <MenuItem
          disabled
          sx={styles.menuItem}
        >
          <PublishIcon />
          <Typography variant="labelMedium">Publish</Typography>
        </MenuItem>
      </span>
    </Tooltip>
  );
});

DisabledPublishMenuItem.displayName = 'DisabledPublishMenuItem';

const DeleteActionWithDialog = memo(props => {
  const { name, onConfirm, closeMenu } = props;
  const [open, setOpen] = useState(false);
  const skipConfirmation = useDeleteConfirmationDisabled();

  const openDialog = useCallback(() => {
    if (skipConfirmation) {
      onConfirm?.();
      closeMenu();
      return;
    }
    closeMenu();
    setOpen(true);
  }, [closeMenu, skipConfirmation, onConfirm]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  const onClickConfirm = useCallback(() => {
    onConfirm?.();
    setOpen(false);
  }, [onConfirm]);

  return (
    <>
      <BasicMenuItem
        icon={<DeleteIcon fontSize="inherit" />}
        label="Delete"
        onClick={openDialog}
      />
      <Modal.DeleteEntityModal
        name={name}
        open={open}
        onClose={onClose}
        onCancel={onClose}
        onConfirm={onClickConfirm}
        shouldRequestInputName
      />
    </>
  );
});

DeleteActionWithDialog.displayName = 'SkillDeleteActionWithDialog';

const SkillRowAction = memo(props => {
  const {
    skillId,
    skillName,
    versionName,
    deleteVersionOnly = false,
    navigateToListAfterDelete = false,
    onDeleted,
    sx,
  } = props;

  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);

  const handleClick = useCallback(event => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const withClose = useCallback(
    onClickSub => () => {
      onClickSub?.();
      handleClose();
    },
    [handleClose],
  );

  const { doExport } = useSkillExport();
  const [deleteSkill] = useDeleteSkillMutation();

  const onExport = useCallback(() => {
    doExport({ skillId, versionName, skillName });
  }, [doExport, skillId, versionName, skillName]);

  const onDelete = useCallback(async () => {
    try {
      const { error } = await deleteSkill({
        projectId,
        skillId,
        versionName: deleteVersionOnly ? versionName : undefined,
      });
      if (error) {
        toastError(buildErrorMessage(error) || 'Failed to delete skill.');
        return;
      }
      toastSuccess(deleteVersionOnly ? 'The version has been deleted' : 'The skill has been deleted');
      onDeleted?.();
      if (navigateToListAfterDelete && !deleteVersionOnly) {
        navigate(`${RouteDefinitions.Skills}/${SkillsTabs[0]}`);
      }
    } catch (error) {
      toastError(buildErrorMessage(error) || 'Failed to delete skill.');
    }
  }, [
    deleteSkill,
    projectId,
    skillId,
    versionName,
    deleteVersionOnly,
    toastError,
    toastSuccess,
    onDeleted,
    navigateToListAfterDelete,
    navigate,
  ]);

  const styles = skillRowActionStyles();

  return (
    <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
      <IconButton
        variant="elitea"
        color="tertiary"
        sx={styles.iconButton}
        id={`${skillId}-skill-action`}
        aria-label="more"
        aria-controls={open ? 'skill-action-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <DotsMenuIcon />
      </IconButton>
      <Menu
        id={`${skillId}-skill-dots-menu`}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            'aria-labelledby': 'skill-action-button',
          },
        }}
        keepMounted
      >
        <BasicMenuItem
          icon={<ExportIcon fontSize="inherit" />}
          label="Export"
          onClick={withClose(onExport)}
        />
        <DisabledPublishMenuItem />
        <DeleteActionWithDialog
          name={skillName}
          onConfirm={withClose(onDelete)}
          closeMenu={handleClose}
        />
      </Menu>
    </Box>
  );
});

SkillRowAction.displayName = 'SkillRowAction';

/** @type {MuiSx} */
const basicMenuItemStyles = () => ({
  menuItem: ({ palette }) => ({
    minWidth: '13.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1.25rem',
    '& .MuiTypography-root': {
      color: palette.text.secondary,
    },
  }),
});

/** @type {MuiSx} */
const skillRowActionStyles = () => ({
  container: {
    width: '2.875rem',
  },
  iconButton: ({ palette }) => ({
    marginLeft: 0,
    '& svg': {
      fontSize: '1rem',
      fill: palette.icon.fill.default,
    },
    '&:hover': {
      '& svg': {
        fill: palette.icon.fill.secondary,
      },
    },
  }),
});

export default SkillRowAction;
