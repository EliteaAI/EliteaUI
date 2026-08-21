import { useCallback, useMemo } from 'react';

import ShareIcon from '@mui/icons-material/Share';
import { Box, Typography, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import DotMenu from '@/components/DotMenu';
import ModelIcon from '@/components/Icons/ModelIcon';

// Use Material-UI Star icon for shared models

const ModelMenu = ({
  disabled,
  models,
  onSelectModel,
  selectedModel,
  onShowMenu = () => {},
  tooltip = 'Switch to model',
}) => {
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
          <Box
            display={'flex'}
            alignItems={'center'}
          >
            {model.shared && (
              <ShareIcon
                sx={{ mr: 1 }}
                fontSize={'inherit'}
              />
            )}
            <Typography
              sx={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                // width: '60%',
                whiteSpaceCollapse: 'preserve',
              }}
              variant="bodyMedium"
            >
              {model.name}
            </Typography>
          </Box>
        ),
        onClick: onClickItem(model),
        isSelected: selectedModel?.name === model.name || selectedModel?.model_name === model.name,
        showCheckIcon: false,
        slotProps: { MenuItem: { sx: { minWidth: '268px', justifyContent: 'space-between' } } },
        key: `${model.id || model.name}-${model.project_id || 'default'}`, // Create unique key combining id/name and project_id
      })),
    [models, onClickItem, selectedModel?.model_name, selectedModel?.name],
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
            minWidth: '16px !important',
            marginRight: '12px',
          },
        },
      }}
      menuStyle={{
        marginLeft: '0px',
        marginTop: '4px',
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
        height: '28px',
        marginLeft: '0px',
        padding: '6px 6px',
        borderRadius: '0px !important',
        boxSizing: 'border-box',
        background: 'transparent',
        '&:hover': {
          color: `${theme.palette.background.button.drawerMenu.hover} !important`,
          background: 'transparent',
        },
      }}
      menuIcon={
        <StyledTooltip
          placement="top"
          title={tooltip}
        >
          <Box
            width={'100%'}
            justifyContent={'flex-start'}
            display={'flex'}
            flexDirection={'row'}
            gap="8px"
            alignItems={'center'}
            height={'32px'}
            boxSizing={'border-box'}
            sx={{
              cursor: 'pointer',
              color: theme.palette.text.secondary,
            }}
          >
            {selectedModel?.model_name ? (
              <Typography
                component={'div'}
                variant="labelSmall"
                sx={{
                  maxWidth: '80px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  wordWrap: 'break-word',
                  textAlign: 'left',
                  '&:hover': {
                    color: theme.palette.text.createButton,
                  },
                }}
                color={disabled ? theme.palette.text.button.disabled : 'text.secondary'}
              >
                {selectedModel?.model_name}
              </Typography>
            ) : (
              <ModelIcon
                fill={disabled ? theme.palette.icon.fill.disabled : theme.palette.icon.fill.secondary}
              />
            )}
          </Box>
        </StyledTooltip>
      }
    >
      {menuItems}
    </DotMenu>
  );
};

export default ModelMenu;
