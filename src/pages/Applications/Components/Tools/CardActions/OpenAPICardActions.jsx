import { useCallback } from 'react';

import { Box, IconButton, Typography, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip.jsx';
import CopyIcon from '@/components/Icons/CopyIcon.jsx';
import useToast from '@/hooks/useToast.jsx';

import { ActionRow, ActionsContainer } from '../ActionsComponent.jsx';

export default function OpenAPICardActions({
  // toolOptions = [],
  selectedTools = [],
  showActions = false,
}) {
  const theme = useTheme();
  const { toastInfo } = useToast();
  const onClickCopy = useCallback(
    value => async () => {
      await navigator.clipboard.writeText(value);
      toastInfo('The action has been copied to clipboard');
    },
    [toastInfo],
  );
  return showActions ? (
    <ActionsContainer>
      {selectedTools.map((item, idx) => {
        return (
          <ActionRow key={idx}>
            <Box
              sx={{
                width: '24px',
                height: '24px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="bodyMedium">-</Typography>
            </Box>
            <Box
              sx={{
                maxWidth: 'calc(100% - 34px)',
                marginLeft: '10px',
                height: '46px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                padding={'4px 12px'}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '32px',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  '&:hover': {
                    background: theme.palette.background.button.secondary.default, //theme.palette.background.categoriesButton.selected.hover
                  },
                  '&:hover .copyButton': {
                    display: 'flex',
                  },
                  gap: '9px',
                }}
              >
                <Typography
                  color="text.secondary"
                  sx={{ height: '24px' }}
                  variant="bodyMedium"
                >
                  {item.name}
                </Typography>
                <StyledTooltip
                  title={'Copy action to clipboard'}
                  placement="top"
                >
                  <IconButton
                    className={'copyButton'}
                    sx={{ marginLeft: '0px', display: 'none' }}
                    variant="elitea"
                    color="tertiary"
                    onClick={onClickCopy(item.name)}
                  >
                    <CopyIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </StyledTooltip>
              </Box>
              <Typography
                sx={{
                  height: '22px',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  padding: '0px 12px',
                }}
                variant="bodySmall"
                component="div"
              >
                {item.description}
              </Typography>
            </Box>
          </ActionRow>
        );
      })}
    </ActionsContainer>
  ) : null;
}
