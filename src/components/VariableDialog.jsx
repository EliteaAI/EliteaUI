import { useCallback, useEffect, useState } from 'react';

import { Button, DialogContent, DialogTitle, Typography, useTheme } from '@mui/material';

import { StyledDialog, StyledDialogActions } from '@/components/StyledDialog';
import VariableList from '@/components/VariableList';

export default function VariableDialog({
  // activeParticipantId,
  open,
  variables = [],
  onOK,
  onCancel,
}) {
  const theme = useTheme();
  const [localVariables, setLocalVariables] = useState(variables || []);
  const handleChangeVariable = useCallback((label, newValue) => {
    setLocalVariables(prev => prev.map(item => (item.name === label ? { ...item, value: newValue } : item)));
  }, []);

  const handleOK = useCallback(() => onOK(localVariables), [localVariables, onOK]);

  const handleCancel = useCallback(() => {
    // Reset local variables to original values when canceling
    setLocalVariables([...variables]);
    onCancel();
  }, [variables, onCancel]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleOK();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    },
    [handleOK, handleCancel],
  );

  useEffect(() => {
    setLocalVariables([...variables]);
  }, [variables]);

  return (
    <StyledDialog
      open={open}
      onKeyDown={handleKeyDown}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          width: '60% !important', // or any custom width
          maxWidth: '60% !important', // or any custom width
          background: `${theme.palette.background.tabPanel} !important`,
          backgroundColor: `${theme.palette.background.tabPanel} !important`,
        },
      }}
    >
      <DialogTitle
        id="variables-dialog-title"
        sx={{ height: '60px' }}
      >
        <Typography variant="headingSmall">{`Variables (${variables.length})`}</Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          width: '100%',
          overflow: 'auto',
          background: `${theme.palette.background.secondary} !important`,
          borderTop: `1px solid ${theme.palette.border.lines}`,
          borderBottom: `1px solid ${theme.palette.border.lines}`,
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'scroll',
        }}
      >
        <VariableList
          disableActiveIndicator
          variables={localVariables}
          onChangeVariable={handleChangeVariable}
          showexpandicon="true"
          multiline
          collapseContent
        />
      </DialogContent>
      <StyledDialogActions
        sx={{
          alignItems: 'center',
          flexDirection: 'row',
          padding: '12px 24px !important',
          gap: '12px',
          height: '60px',
        }}
      >
        <Button
          variant="secondary"
          color="secondary"
          onClick={handleCancel}
          disableRipple
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleOK}
          disableRipple
        >
          Apply
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
}
