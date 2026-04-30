import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { Box } from '@mui/system';

import { useDeleteConfirmationDisabled } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { useDeleteApplicationMutation } from '@/api/applications';
import { useDeleteConfigurationMutation } from '@/api/configurations';
import { useDeleteDatasourceMutation } from '@/api/datasources';
import { useToolkitDeleteMutation } from '@/api/toolkits.js';
import { PERMISSIONS, ViewMode } from '@/common/constants';
import { getEntityNameByCardType } from '@/components/Fork/useForkEntity';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DotsMenuIcon from '@/components/Icons/DotsMenuIcon';
import ExportIcon from '@/components/Icons/ExportIcon';
import PinIcon from '@/components/Icons/PinIcon';
import NestedMenuItem from '@/components/NestedMenuItem';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

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

BasicMenuItem.displayName = 'BasicMenuItem';

const ActionWithDialog = memo(props => {
  const { icon, label, name, onConfirm, closeMenu } = props;
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
    closeMenu();
    setOpen(false);
  }, [closeMenu]);

  const onClickConfirm = useCallback(() => {
    onConfirm?.();
    setOpen(false);
  }, [onConfirm]);

  return (
    <>
      <BasicMenuItem
        icon={icon}
        label={label}
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

ActionWithDialog.displayName = 'ActionWithDialog';

const DataRowAction = memo(props => {
  const { data, viewMode, type, isPinnedItem = false, onTogglePin } = props;
  const { checkPermission } = useCheckPermission();
  const { id: myAuthorId } = useSelector(state => state.user);
  const { cardType } = data;
  const realCardType = useMemo(() => cardType || type, [cardType, type]);
  const entity_name = getEntityNameByCardType(realCardType);

  const { toastError, toastSuccess } = useToast();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const handleClick = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const withClose = useCallback(
    onClickSub => () => {
      onClickSub();
      handleClose();
    },
    [handleClose],
  );

  const projectId = useSelectedProjectId();

  const isOwner = useMemo(() => {
    if (entity_name === 'toolkits') {
      return data?.author_id === myAuthorId;
    } else if (entity_name === 'credentials') {
      return data?.project_id === projectId;
    }

    return viewMode === ViewMode.Owner;
  }, [viewMode, entity_name, data, myAuthorId, projectId]);

  /** Prompt? Actions start*/
  const [deleteDatasouce] = useDeleteDatasourceMutation();
  const [deleteApplication] = useDeleteApplicationMutation();
  const [deleteToolkit] = useToolkitDeleteMutation();
  const [deleteCredential] = useDeleteConfigurationMutation();
  const doDeleteDatasource = useCallback(async () => {
    await deleteDatasouce({ projectId, datasourceId: data?.id });
  }, [data?.id, deleteDatasouce, projectId]);
  const doDeleteApplication = useCallback(async () => {
    await deleteApplication({ projectId, applicationId: data?.id });
  }, [data?.id, deleteApplication, projectId]);
  const doDeleteToolkit = useCallback(async () => {
    await deleteToolkit({ projectId, toolkitId: data?.id });
  }, [data?.id, deleteToolkit, projectId]);
  const doDeleteCredential = useCallback(async () => {
    const { error } = await deleteCredential({
      projectId,
      configId: data?.originalId || data?.id,
      section: data?.section,
    });
    if (!error) {
      toastSuccess('The credential has been deleted');
    } else {
      toastError('Failed to delete credential');
    }
  }, [data?.id, data?.originalId, data?.section, deleteCredential, projectId, toastSuccess, toastError]);

  const onDelete = useCallback(() => {
    if (entity_name === 'datasources') {
      doDeleteDatasource();
    } else if (entity_name === 'applications' || entity_name === 'pipelines') {
      doDeleteApplication();
    } else if (entity_name === 'toolkits') {
      doDeleteToolkit();
    } else if (entity_name === 'credentials') {
      doDeleteCredential();
    }
  }, [doDeleteApplication, doDeleteToolkit, doDeleteDatasource, doDeleteCredential, entity_name]);

  const deleteMenuItem = useMemo(
    () => ({
      icon: <DeleteIcon fontSize={'inherit'} />,
      label: 'Delete',
      confirmText: `Are you sure you want to delete ${data?.name}?`,
      alarm: true,
      onConfirm: onDelete,
    }),
    [data?.name, onDelete],
  );

  const menuItemStyles = menuItemIconStyles();

  const pinMenuItem = useMemo(
    () => ({
      onClick: () => {
        onTogglePin?.(data?.id);
        handleClose();
      },
      icon: <PinIcon sx={menuItemStyles.pinIcon} />,
      label: isPinnedItem ? 'Unpin' : 'Pin to top',
    }),
    [isPinnedItem, onTogglePin, data?.id, handleClose, menuItemStyles.pinIcon],
  );

  const applicationMenu = useMemo(() => {
    const list = [];
    if (onTogglePin) {
      list.push(pinMenuItem);
    }
    if (checkPermission(PERMISSIONS[entity_name]?.delete)) {
      list.push(deleteMenuItem);
    }

    return list;
  }, [checkPermission, deleteMenuItem, entity_name, onTogglePin, pinMenuItem]);

  const toolkitsMenu = useMemo(() => {
    const list = [];
    if (onTogglePin) {
      list.push(pinMenuItem);
    }
    // Actions in the specified order: Delete, Export, Fork
    // Use permission check for delete (same as applications)
    if (checkPermission(PERMISSIONS[entity_name]?.delete)) {
      list.push(deleteMenuItem);
    }
    // if (checkPermission(PERMISSIONS[entity_name]?.export)) {
    //   list.push(exportMenu)
    // }
    // if (checkPermission(PERMISSIONS[entity_name]?.fork)) {
    //   list.push(forkMenuItem)
    // }

    return list;
  }, [checkPermission, deleteMenuItem, entity_name, onTogglePin, pinMenuItem]);

  const credentialsMenu = useMemo(() => {
    const list = [];

    if (onTogglePin) {
      list.push(pinMenuItem);
    }
    // Actions in the specified order: Delete only (like toolkits)
    if (isOwner) {
      list.push(deleteMenuItem);
    }

    return list;
  }, [deleteMenuItem, isOwner, onTogglePin, pinMenuItem]);

  const menuList = useMemo(() => {
    let list = [];
    if (entity_name === 'applications' || entity_name === 'pipelines') {
      list = applicationMenu;
    } else if (entity_name === 'toolkits') {
      list = toolkitsMenu;
    } else if (entity_name === 'credentials') {
      list = credentialsMenu;
    }

    return list.map(({ onClick, icon, label, subMenu, confirmText, onConfirm, disabled }, index) => {
      if (subMenu) {
        return (
          <NestedMenuItem
            key={index}
            leftIcon={<ExportIcon fontSize="inherit" />}
            label="Export"
            parentMenuOpen={open}
            MenuItemComponent={MenuItem}
            onClick={handleClose}
            sx={basicMenuItemStyles().menuItem}
          >
            {subMenu.map(({ onClick: onClickSub, label: subLabel }, indexSub) => {
              return (
                <BasicMenuItem
                  key={indexSub}
                  label={subLabel}
                  onClick={withClose(onClickSub)}
                />
              );
            })}
          </NestedMenuItem>
        );
      }
      if (confirmText) {
        return (
          <ActionWithDialog
            closeMenu={handleClose}
            key={index}
            icon={icon}
            label={label}
            confirmText={confirmText}
            name={data?.name}
            onConfirm={withClose(onConfirm)}
          />
        );
      }

      return (
        <BasicMenuItem
          key={index}
          icon={icon}
          label={label}
          onClick={withClose(onClick)}
          disabled={disabled}
        />
      );
    });
  }, [entity_name, applicationMenu, toolkitsMenu, credentialsMenu, withClose, open, handleClose, data?.name]);

  const styles = dataRowActionStyles(menuList.length > 0);

  return (
    <Box sx={styles.container}>
      <IconButton
        variant="elitea"
        color="tertiary"
        sx={styles.iconButton}
        id={data?.id + '-action'}
        aria-label="more"
        aria-controls={open ? 'action-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        disabled={!menuList.length}
        onClick={handleClick}
      >
        <DotsMenuIcon />
      </IconButton>
      <Menu
        id={data?.id + '-dots-menu'}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            'aria-labelledby': 'action-button',
          },
        }}
        keepMounted
      >
        {menuList}
      </Menu>
    </Box>
  );
});

DataRowAction.displayName = 'DataRowAction';

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
const menuItemIconStyles = () => ({
  pinIcon: {
    fontSize: '1rem',
  },
});

/** @type {MuiSx} */
const dataRowActionStyles = hasMenuItems => ({
  container: {
    width: '2.875rem',
  },
  iconButton: ({ palette }) => ({
    marginLeft: 0,
    '& svg': {
      fontSize: '1rem',
      fill: !hasMenuItems ? palette.icon.fill.disabled : palette.icon.fill.default,
    },
    '&:hover': {
      '& svg': {
        fill: palette.icon.fill.secondary,
      },
    },
  }),
});

export default DataRowAction;
