import { Box, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';

import { useTheme } from '@emotion/react';

import CloseIcon from './Icons/CloseIcon';

export default function PipelineStateViewModal({ open, onClose, value = '', label = '' }) {
  const theme = useTheme();

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onKeyDown={handleKeyDown}
      slotProps={{
        paper: {
          sx: {
            background: theme.palette.background.tabPanel,
            borderRadius: '16px',
            border: `1px solid ${theme.palette.border.lines}`,
            boxShadow: theme.palette.boxShadow.default,
            marginTop: 0,
            maxWidth: '90vw',
            height: 'calc(100vh - 160px)',
            marginLeft: '0px',
            marginRight: '0px',
            marginBottom: '0px',
          },
        },
      }}
    >
      <DialogTitle
        variant="headingMedium"
        color="text.secondary"
        sx={{ height: '60px', padding: '16px 32px' }}
      >
        <Box
          display={'flex'}
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          {label}
          <IconButton
            sx={{ marginLeft: '0px' }}
            variant="elitea"
            color="tertiary"
            onClick={onClose}
          >
            <CloseIcon
              fill={theme.palette.icon.fill.default}
              sx={{ fontSize: '16px', cursor: 'pointer' }}
            />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          padding: '16px 32px !important',
          width: '80vw',
          maxWidth: '900px',
          height: 'calc(100vh - 220px)',
          borderTop: `1px solid ${theme.palette.border.lines}`,
          background: theme.palette.background.showContextDialog,
          overflowY: 'scroll',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {JSON.stringify(value)}
      </DialogContent>
    </Dialog>
  );
}
