import { memo, useCallback, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box, IconButton, Menu } from '@mui/material';

import { useDeleteSkillMutation } from '@/[fsd]/features/skill/api';
import { useSkillExport } from '@/[fsd]/features/skill/lib/hooks';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SkillsTabs } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils.jsx';
import DotsMenuIcon from '@/components/Icons/DotsMenuIcon';
import ExportIcon from '@/components/Icons/ExportIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import { DisabledPublishMenuItem, SkillDeleteActionWithDialog, SkillRowMenuItem } from './skill-row-action';

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
        variant={BUTTON_VARIANTS.elitea}
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
        <SkillRowMenuItem
          icon={<ExportIcon fontSize="inherit" />}
          label="Export"
          onClick={withClose(onExport)}
        />
        <DisabledPublishMenuItem />
        <SkillDeleteActionWithDialog
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
