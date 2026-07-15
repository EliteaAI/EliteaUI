import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Divider, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import ListItemText from '@mui/material/ListItemText';

import Tooltip from '@/ComponentsLib/Tooltip';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { useDeleteConfirmationDisabled } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import CheckedIcon from '@/assets/checked-icon.svg?react';
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
  skipConfirmation,
  testId,
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

  const { sx: menuItemSX = {}, ...menuItemProps } = slotProps.MenuItem || {};

  return (
    <>
      <MenuItem
        data-testid={testId ? `${testId}-menuitem` : undefined}
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
                inlineExtraContent={subMenuItem.inlineExtraContent}
                textContent={subMenuItem.textContent}
                setActiveDialog={setActiveDialog}
                dialogKey={subMenuItem.key || subMenuItem.label}
                skipConfirmation={skipConfirmation}
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
  textContent,
  modalSx,
  setActiveDialog,
  dialogKey,
  skipConfirmation,
  addSeparator,
  testId,
}) => {
  const openDialog = useCallback(
    event => {
      event.stopPropagation();
      if (skipConfirmation && entityName && shouldRequestInputName) {
        onConfirm?.();
        closeMenu();
        return;
      }
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
          textContent,
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
      textContent,
      modalSx,
      skipConfirmation,
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
      addSeparator={addSeparator}
      testId={testId}
    />
  );
};

const DotMenu = memo(props => {
  const {
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
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeDialog, setActiveDialog] = useState(null);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const skipConfirmation = useDeleteConfirmationDisabled();

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
          data-testid={id ? `${id}-menu-button` : undefined}
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
          {...anchorButtonProps}
        >
          {menuIcon || <DotsMenuIcon />}
        </IconButton>
      )}
      <Menu
        data-testid={id ? `${id}-menu` : undefined}
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
                testId: item.key,
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
                    textContent={item.textContent}
                    modalSx={item.modalSx}
                    setActiveDialog={setActiveDialog}
                    dialogKey={item.key || item.label}
                    skipConfirmation={skipConfirmation}
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
                    skipConfirmation={skipConfirmation}
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
                    testId: item.key,
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
                        textContent={item.textContent}
                        modalSx={item.modalSx}
                        setActiveDialog={setActiveDialog}
                        dialogKey={item.key || item.label}
                        skipConfirmation={skipConfirmation}
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
      {activeDialog &&
        (activeDialog.props.entityName ? (
          <Modal.DeleteEntityModal
            open={true}
            onClose={handleDialogClose}
            onConfirm={handleDialogConfirm}
            name={activeDialog.props.entityName}
            shouldRequestInputName={activeDialog.props.shouldRequestInputName}
            extraContent={activeDialog.props.extraContent}
            inlineExtraContent={activeDialog.props.inlineExtraContent}
            textContent={activeDialog.props.textContent}
            sx={activeDialog.props.modalSx}
          />
        ) : (
          <Modal.BaseModal
            open={true}
            variant={ModalConstants.MODAL_VARIANT.simple}
            titleIcon={ModalConstants.MODAL_ICON_TYPE.info}
            title={activeDialog.props.alertTitle}
            content={activeDialog.props.confirmText}
            onClose={handleDialogClose}
            onConfirm={handleDialogConfirm}
            confirmButtonText={activeDialog.props.confirmButtonTitle}
            alarm={activeDialog.props.alarm}
          />
        ))}
    </Box>
  );
});

DotMenu.displayName = 'DotMenu';

/** @type {MuiSx} */
const dotMenuStyles = () => ({
  iconButton: ({ palette }) => ({
    marginLeft: 0,
    'svg, &:hover svg': { fill: palette.icon.fill.secondary },
  }),
});

export default DotMenu;
