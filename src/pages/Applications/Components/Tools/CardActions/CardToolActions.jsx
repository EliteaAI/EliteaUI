import { useCallback, useMemo } from 'react';

import { Box, IconButton, Typography, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip.jsx';
import CopyIcon from '@/components/Icons/CopyIcon.jsx';
import useToast from '@/hooks/useToast.jsx';

import { ActionRow, ActionsContainer } from '../ActionsComponent.jsx';

const CardToolActions = ({ toolOptions = [], selectedTools = [], showActions = false }) => {
  const theme = useTheme();
  const availableTools = useMemo(() => {
    return toolOptions.reduce((acc, i) => {
      acc[i.value] = i.label;
      return acc;
    }, {});
  }, [toolOptions]);

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
      {selectedTools.map(i => {
        return (
          <ActionRow
            sx={{ paddingTop: '4px' }}
            key={i}
          >
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
              gap={'8px'}
              sx={{
                maxWidth: 'calc(100% - 34px)',
                marginLeft: '10px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                padding: '4px 12px',
                borderRadius: '32px',
                overflow: 'hidden',
                '&:hover': {
                  background: theme.palette.background.button.secondary.default, //theme.palette.background.categoriesButton.selected.hover
                },
                '&:hover .copyButton': {
                  display: 'flex',
                },
              }}
            >
              <Typography
                color="text.secondary"
                sx={{
                  height: '24px',
                  wordWrap: 'break-word',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  width: '100%',
                }}
                variant="bodyMedium"
                component="div"
              >
                {availableTools[i] || i}
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
                  onClick={onClickCopy(i)}
                >
                  <CopyIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </StyledTooltip>
            </Box>
          </ActionRow>
        );
      })}
    </ActionsContainer>
  ) : null;
};

export default CardToolActions;
