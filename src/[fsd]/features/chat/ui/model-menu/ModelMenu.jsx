import { memo, useCallback, useMemo } from 'react';

import ShareIcon from '@mui/icons-material/Share';
import { Box, Typography, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import DotMenu from '@/components/DotMenu';
import ModelIcon from '@/components/Icons/ModelIcon';

// Use Material-UI Star icon for shared models

const ModelMenu = memo(props => {
  const {
    disabled,
    models,
    onSelectModel,
    selectedModel,
    onShowMenu = () => {},
    tooltip = 'Switch to model',
  } = props;
  const styles = useMemo(() => modelMenuStyles(), []);

  const theme = useTheme();
  const onClickItem = useCallback(
    model => () => {
      onSelectModel(model);
    },
    [onSelectModel],
  );

  const menuItems = useMemo(
    () =>
      models?.map(model => ({
        label: (
          <Box sx={styles.trigger}>
            {model.shared && (
              <ShareIcon
                sx={{ mr: 1 }}
                fontSize={'inherit'}
              />
            )}
            <Typography
              sx={styles.modelName}
              variant="bodyMedium"
            >
              {model.name}
            </Typography>
          </Box>
        ),
        onClick: onClickItem(model),
        isSelected: selectedModel?.name === model.name || selectedModel?.model_name === model.name,
        showCheckIcon: false,
        slotProps: { MenuItem: { sx: { minWidth: '16.75rem', justifyContent: 'space-between' } } },
        key: `${model.id || model.name}-${model.project_id || 'default'}`, // Create unique key combining id/name and project_id
      })),
    [models, onClickItem, selectedModel?.model_name, selectedModel?.name, styles],
  );

  return (
    <DotMenu
      disabled={disabled}
      onShowMenuList={onShowMenu}
      slotProps={{
        ListItemText: {
          sx: { color: theme.palette.text.secondary },
          primaryTypographyProps: { variant: 'bodyMedium' },
        },
        ListItemIcon: {
          sx: {
            minWidth: '1rem !important',
            marginRight: '0.75rem',
          },
        },
      }}
      menuStyle={{
        marginLeft: '0',
        marginTop: '0.25rem',
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      menuIconSX={{
        width: 'auto',
        height: '1.75rem',
        marginLeft: '0',
        padding: '0.375rem 0.375rem',
        borderRadius: '0 !important',
        boxSizing: 'border-box',
        background: 'transparent',
        '&:hover': {
          color: `${theme.palette.components.button.background.drawerMenu.hover} !important`,
          background: 'transparent',
        },
      }}
      menuIcon={
        <StyledTooltip
          placement="top"
          title={tooltip}
        >
          <Box sx={styles.menuHeader}>
            {selectedModel?.model_name ? (
              <Typography
                component={'div'}
                variant="labelSmall"
                sx={styles.menuHeaderLabel}
                color={disabled ? theme.palette.text.muted : 'text.secondary'}
              >
                {selectedModel?.model_name}
              </Typography>
            ) : (
              <ModelIcon fill={disabled ? theme.palette.icon.disabled : theme.palette.icon.secondary} />
            )}
          </Box>
        </StyledTooltip>
      }
    >
      {menuItems}
    </DotMenu>
  );
});

ModelMenu.displayName = 'ModelMenu';

/** @type {MuiSx} */
const modelMenuStyles = () => ({
  trigger: {
    display: 'flex',
    alignItems: 'center',
  },
  modelName: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpaceCollapse: 'preserve',
  },
  menuHeader: ({ palette }) => ({
    width: '100%',
    justifyContent: 'flex-start',
    display: 'flex',
    flexDirection: 'row',
    gap: '0.5rem',
    alignItems: 'center',
    height: '2rem',
    boxSizing: 'border-box',
    cursor: 'pointer',
    color: palette.text.secondary,
  }),
  menuHeaderLabel: ({ palette }) => ({
    maxWidth: '5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordWrap: 'break-word',
    textAlign: 'left',
    '&:hover': {
      color: palette.components.button.text.create,
    },
  }),
});

export default ModelMenu;
