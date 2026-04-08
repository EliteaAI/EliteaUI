import { useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { PERMISSIONS } from '@/common/constants';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import ForkIcon from '@/components/Icons/ForkIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useTheme } from '@emotion/react';

import { useForkEntity } from './useForkEntity';

const useForkEntityButton = (id, title, entity_name, data = {}) => {
  const { checkPermission } = useCheckPermission();
  const { doFork, isLoading, tooltipTitle } = useForkEntity({ id, entity_name, title, data });
  return {
    checkPermission,
    doFork,
    isLoading,
    tooltipTitle,
  };
};

export const useForkEntityMenu = ({
  id,
  title,
  entity_name,
  validatePermission = true,
  data = {},

  disabled = false,
}) => {
  const theme = useTheme();
  const { openWizard } = useSelector(state => state.importWizard);
  const { checkPermission, doFork, isLoading } = useForkEntityButton(id, title, entity_name, data);

  const onClick = useCallback(() => {
    if (openWizard) return;

    doFork();
  }, [doFork, openWizard]);

  const menuItem = useMemo(
    () =>
      !!entity_name && (checkPermission(PERMISSIONS[entity_name].fork) || !validatePermission)
        ? {
            label: 'Fork',
            icon: (
              <>
                <ForkIcon
                  sx={{ fontSize: '16px' }}
                  fill={theme.palette.icon.fill.default}
                />
                {isLoading && <StyledCircleProgress size={20} />}
              </>
            ),
            disabled,
            onClick,
          }
        : undefined,
    [
      entity_name,
      checkPermission,
      validatePermission,
      theme.palette.icon.fill.default,
      isLoading,
      disabled,
      onClick,
    ],
  );

  return {
    forkEntityMenuItem: menuItem,
  };
};

export default function ForkEntityButton({
  id,
  title,
  button_type = 'secondary',
  fill_color,
  entity_name,
  validatePermission = true,
  data = {},
  disabled = false,
}) {
  const theme = useTheme();
  const { checkPermission, doFork, isLoading, tooltipTitle } = useForkEntityButton(
    id,
    title,
    entity_name,
    data,
  );

  return !!entity_name && (checkPermission(PERMISSIONS[entity_name].fork) || !validatePermission) ? (
    <>
      <Tooltip
        title={tooltipTitle}
        placement="top"
      >
        <IconButton
          aria-label={tooltipTitle}
          variant="elitea"
          color={button_type}
          onClick={doFork}
          disabled={disabled}
          sx={{
            marginLeft: '0px',
            padding: '0px !important',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ForkIcon
            sx={{ fontSize: '16px' }}
            fill={fill_color || theme.palette.icon.fill.secondary}
          />
          {isLoading && <StyledCircleProgress size={20} />}
        </IconButton>
      </Tooltip>
    </>
  ) : null;
}
