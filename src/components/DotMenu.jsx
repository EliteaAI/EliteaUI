import { useCallback, useMemo, useState } from 'react';

import { Box, Divider, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import ListItemText from '@mui/material/ListItemText';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Modal } from '@/[fsd]/shared/ui';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import AlertDialogV2 from '@/components/AlertDialogV2';
import DotsMenuIcon from '@/components/Icons/DotsMenuIcon';
import { useTheme } from '@emotion/react';

const BasicMenuItem = ({
  icon,
  label,
  onClick,
  disabled,
  subMenuItems,
  onCloseSubMenu,
  slotProps = { ListItemText: {}, MenuItem: {}, ListItemIcon: {} },
  addSeparator = false,
  isSelected,
  showCheckIcon,
  setActiveDialog,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const onClickMenu = useCallback(event => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const withClose = useCallback(
    onClickSub => () => {
      if (onClickSub) {
        onClickSub();
      }
      handleClose();
      onCloseSubMenu();
    },
    [handleClose, onCloseSubMenu],
  );

  const { sx: menuItemSX = {}, menuItemProps } = slotProps.MenuItem || {};

  return (
    <>
      <MenuItem
        onClick={subMenuItems?.length ? onClickMenu : onClick}
        disabled={disabled}
        sx={{
          marginTop: addSeparator ? '-4px' : undefined,
          background: isSelected ? theme.palette.background.participant.active : undefined,
          ...(menuItemSX || {}),
        }}
        {...menuItemProps}
      >
        {icon && <ListItemIcon {...slotProps.ListItemIcon}>{icon}</ListItemIcon>}
        <ListItemText
          slotProps={{ primary: { variant: 'labelMedium' } }}
          {...slotProps.ListItemText}
        >
          {label}
        </ListItemText>
        {isSelected && showCheckIcon && (
          <ListItemIcon {...slotProps.ListItemIcon}>
            <CheckedIcon />
          </ListItemIcon>
        )}
      </MenuItem>
      {addSeparator && (
        <Divider
          sx={{
            display: 'block',
            height: '1px',
            borderColor: theme.palette.border.lines,
            width: '100%',
            marginTop: '4px !important',
            marginBottom: '4px !important',
          }}
        />
      )}
      {subMenuItems?.length && (
        <Menu
          anchorEl={anchorEl}
          open={open}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          onClose={handleClose}
        >
          {subMenuItems.map(subMenuItem => {
            const subCommonProps = {
              label: subMenuItem.label,
              icon: subMenuItem.icon,
              disabled: subMenuItem.disabled,
              addSeparator: subMenuItem.addSeparator,
              slotProps,
              isSelected: subMenuItem.isSelected,
              entityName: subMenuItem.entityName,
              showCheckIcon: subMenuItem.entityName,
            };
            return subMenuItem.onConfirm || subMenuItem.confirmText ? (
              <ActionWithDialog
                {...subCommonProps}
                key={subMenuItem.key || subMenuItem.label}
                alertTitle={subMenuItem.alertTitle}
                confirmText={subMenuItem.confirmText}
                confirmButtonTitle={subMenuItem.confirmButtonTitle}
                confirmButtonSX={subMenuItem.confirmButtonSX}
                onConfirm={subMenuItem.onConfirm}
                closeMenu={handleClose}
                alarm={subMenuItem.alarm}
                entityName={subMenuItem.entityName}
                shouldRequestInputName={subMenuItem.shouldRequestInputName}
                setActiveDialog={setActiveDialog}
                dialogKey={subMenuItem.key || subMenuItem.label}
              />
            ) : (
              <BasicMenuItem
                {...subCommonProps}
                key={subMenuItem.key || subMenuItem.label}
                onClick={withClose(subMenuItem.onClick)}
                setActiveDialog={setActiveDialog}
              />
            );
          })}
        </Menu>
      )}
    </>
  );
};

const ActionWithDialog = ({
  icon,
  label,
  confirmText,
  alertTitle = 'Warning',
  onConfirm,
  closeMenu,
  disabled,
  confirmButtonTitle,
  confirmButtonSX,
  alarm,
  slotProps,
  entityName,
  showCheckIcon,
  shouldRequestInputName = true,
  extraContent,
  inlineExtraContent,
  modalSx,
  setActiveDialog,
  dialogKey,
}) => {
  const openDialog = useCallback(
    event => {
      event.stopPropagation();
      setActiveDialog({
        key: dialogKey,
        props: {
          confirmText,
          alertTitle,
          onConfirm,
          confirmButtonTitle,
          confirmButtonSX,
          alarm,
          entityName,
          shouldRequestInputName,
          extraContent,
          inlineExtraContent,
          modalSx,
        },
      });
      closeMenu();
    },
    [
      dialogKey,
      setActiveDialog,
      confirmText,
      alertTitle,
      onConfirm,
      closeMenu,
      confirmButtonTitle,
      confirmButtonSX,
      alarm,
      entityName,
      shouldRequestInputName,
      extraContent,
      inlineExtraContent,
      modalSx,
    ],
  );

  return (
    <BasicMenuItem
      slotProps={slotProps}
      icon={icon}
      label={label}
      onClick={openDialog}
      disabled={disabled}
      showCheckIcon={showCheckIcon}
    />
  );
};

export default function DotMenu({
  id,
  menuIcon,
  menuIconSX = {},
  iconColor = 'tertiary',
  children,
  onClose,
  onShowMenuList,
  anchorOrigin,
  transformOrigin,
  multipleColumns,
  columnSize,
  columnMinWidth = '150px',
  menuStyle,
  slotProps = {},
  AnchorButton,
  anchorButtonProps = {},
  shouldStopPropagation = true,
  disabled,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeDialog, setActiveDialog] = useState(null);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);

  const onClickMenu = useCallback(
    event => {
      shouldStopPropagation && event.stopPropagation();
    },
    [shouldStopPropagation],
  );

  const handleClick = useCallback(
    event => {
      shouldStopPropagation && event.stopPropagation();
      setAnchorEl(event.currentTarget);
      if (onShowMenuList) {
        onShowMenuList();
      }
    },
    [onShowMenuList, shouldStopPropagation],
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleDialogClose = useCallback(() => {
    setActiveDialog(null);
    handleClose();
  }, [handleClose]);

  const handleDialogConfirm = useCallback(() => {
    if (activeDialog?.props?.onConfirm) {
      activeDialog.props.onConfirm();
    }
    setActiveDialog(null);
    handleClose();
  }, [activeDialog, handleClose]);

  const withClose = useCallback(
    onClickSub => () => {
      onClickSub?.();
      handleClose();
    },
    [handleClose],
  );

  const styles = dotMenuStyles();

  const splittedChildren = useMemo(() => {
    if (!multipleColumns) {
      return children;
    } else {
      const newArray = [];
      for (let i = 0; i < children.length; i += columnSize) {
        newArray.push(children.slice(i, i + columnSize));
      }
      return newArray;
    }
  }, [children, columnSize, multipleColumns]);

  const TooltipWrapper = ({ children: tooltipChildren, tooltip }) => {
    if (!tooltip) return tooltipChildren;

    return (
      <Tooltip
        title={tooltip}
        placement="top"
      >
        <Box component="span">{tooltipChildren}</Box>
      </Tooltip>
    );
  };

  return (
    <Box onClick={onClickMenu}>
      {AnchorButton ? (
        <AnchorButton
          {...anchorButtonProps}
          disabled={disabled}
          onClick={handleClick}
        />
      ) : (
        <IconButton
          variant="elitea"
          color={iconColor}
          id={id + '-action'}
          // aria-label="more"
          aria-controls={open ? id + '-dots-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          disabled={disabled}
          sx={[styles.iconButton, menuIconSX]}
        >
          {menuIcon || <DotsMenuIcon />}
        </IconButton>
      )}
      <Menu
        id={id + '-dots-menu'}
        anchorEl={anchorEl}
        open={open}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'action-button',
          },
        }}
        sx={menuStyle}
      >
        {!multipleColumns ? (
          splittedChildren
            .filter(item => item)
            .map(item => {
              const commonProps = {
                label: item.label,
                icon: item.icon,
                entityName: item.entityName,
                disabled: item.disabled,
                subMenuItems: item.subMenuItems,
                slotProps: { ...(slotProps || {}), ...(item.slotProps || {}) },
                addSeparator: item.addSeparator,
                isSelected: item.isSelected,
                showCheckIcon: item.showCheckIcon,
              };

              return item.onConfirm || item.confirmText ? (
                <TooltipWrapper
                  tooltip={item.tooltip}
                  key={item.key || item.label}
                >
                  <ActionWithDialog
                    {...commonProps}
                    alertTitle={item.alertTitle}
                    confirmText={item.confirmText}
                    confirmButtonTitle={item.confirmButtonTitle}
                    confirmButtonSX={item.confirmButtonSX}
                    onConfirm={item.onConfirm}
                    closeMenu={handleClose}
                    alarm={item.alarm}
                    entityName={item.entityName}
                    shouldRequestInputName={item.shouldRequestInputName}
                    extraContent={item.extraContent}
                    inlineExtraContent={item.inlineExtraContent}
                    modalSx={item.modalSx}
                    setActiveDialog={setActiveDialog}
                    dialogKey={item.key || item.label}
                  />
                </TooltipWrapper>
              ) : (
                <TooltipWrapper
                  tooltip={item.tooltip}
                  key={item.key || item.label}
                >
                  <BasicMenuItem
                    {...commonProps}
                    onClick={withClose(item.onClick)}
                    onCloseSubMenu={handleClose}
                    setActiveDialog={setActiveDialog}
                  />
                </TooltipWrapper>
              );
            })
        ) : (
          <Box display="flex">
            {splittedChildren?.map((subChildren, index) => (
              <Box
                key={index}
                minWidth={columnMinWidth}
              >
                {subChildren.map(item => {
                  const commonProps = {
                    label: item.label,
                    icon: item.icon,
                    entityName: item.entityName,
                    disabled: item.disabled,
                    subMenuItems: item.subMenuItems,
                    slotProps: { ...(slotProps || {}), ...(item.slotProps || {}) },
                    addSeparator: item.addSeparator,
                    isSelected: item.isSelected,
                    showCheckIcon: item.showCheckIcon,
                  };
                  return item.onConfirm || item.confirmText ? (
                    <TooltipWrapper
                      key={item.key || item.label}
                      tooltip={item.tooltip}
                    >
                      <ActionWithDialog
                        {...commonProps}
                        alertTitle={item.alertTitle}
                        confirmText={item.confirmText}
                        confirmButtonTitle={item.confirmButtonTitle}
                        confirmButtonSX={item.confirmButtonSX}
                        onConfirm={item.onConfirm}
                        closeMenu={handleClose}
                        alarm={item.alarm}
                        entityName={item.entityName}
                        shouldRequestInputName={item.shouldRequestInputName}
                        extraContent={item.extraContent}
                        inlineExtraContent={item.inlineExtraContent}
                        modalSx={item.modalSx}
                        setActiveDialog={setActiveDialog}
                        dialogKey={item.key || item.label}
                      />
                    </TooltipWrapper>
                  ) : (
                    <TooltipWrapper
                      key={item.key || item.label}
                      tooltip={item.tooltip}
                    >
                      <BasicMenuItem
                        {...commonProps}
                        onClick={withClose(item.onClick)}
                        onCloseSubMenu={handleClose}
                        setActiveDialog={setActiveDialog}
                      />
                    </TooltipWrapper>
                  );
                })}
              </Box>
            ))}
          </Box>
        )}
      </Menu>
      {activeDialog && !activeDialog.props.entityName && (
        <AlertDialogV2
          open={true}
          setOpen={() => setActiveDialog(null)}
          alarm={activeDialog.props.alarm}
          title={activeDialog.props.alertTitle}
          confirmButtonSX={activeDialog.props.confirmButtonSX}
          confirmButtonTitle={activeDialog.props.confirmButtonTitle}
          content={activeDialog.props.confirmText}
          onConfirm={handleDialogConfirm}
          onCancel={handleDialogClose}
        />
      )}
      {activeDialog && activeDialog.props.entityName && (
        <Modal.DeleteEntityModal
          shouldRequestInputName={activeDialog.props.shouldRequestInputName}
          name={activeDialog.props.entityName}
          open={true}
          onClose={handleDialogClose}
          onCancel={handleDialogClose}
          onConfirm={handleDialogConfirm}
          extraContent={activeDialog.props.extraContent}
          inlineExtraContent={activeDialog.props.inlineExtraContent}
          sx={activeDialog.props.modalSx}
        />
      )}
    </Box>
  );
}

/** @type {MuiSx} */
const dotMenuStyles = () => ({
  iconButton: ({ palette }) => ({
    marginLeft: 0,
    'svg, &:hover svg': { fill: palette.icon.fill.secondary },
  }),
});
