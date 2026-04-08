import React, { useCallback } from 'react';

import { Button } from '@mui/material';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { CREATE_VERSION, MAX_VERSION_LENGTH, SAVE } from '@/common/constants';
import { useCtrlEnterKeyEventsHandler } from '@/components/Chat/hooks';
import FrameIcon from '@/components/Icons/FrameIcon';

const StyledInput = styled(TextField)(({ theme }) => ({
  marginTop: '1rem',
  marginBottom: '1rem',
  '& .MuiFormLabel-root': {
    fontSize: '14px',
    lineHeight: '24px',
    fontWeight: 400,
    left: '12px',
  },
  '& .MuiInputLabel-shrink': {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 400,
    top: '6px',
  },
  '& .MuiInputBase-root': {},
  '& input[type=number]': {
    MozAppearance: 'textfield',
  },
  '& input[type=number]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type=number]::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& textarea::-webkit-scrollbar': {
    display: 'none',
  },
  '& label': {
    color: theme.palette.text.primary,
  },
  '& input': {
    color: theme.palette.text.secondary,
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '24px',
    height: '24px',
    boxSizing: 'border-box',
    marginBottom: '8px',
  },
  '& textarea': {
    color: theme.palette.text.secondary,
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '24px',
    boxSizing: 'border-box',
    marginBottom: '8px',
  },
  '& .MuiInput-underline': {
    padding: '0 12px',
  },
  '& .MuiInput-underline:before': {
    borderBottomColor: theme.palette.border.lines,
  },
}));

const Title = styled(Typography)(
  ({ theme }) => `
  font-family: Montserrat;
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 600;
  line-height: 1.5rem; /* 171.429% */
  color: ${theme.palette.text.secondary};
`,
);

const StyledDialog = styled(Dialog)(
  () => `
  display: flex;
  padding: 1rem 1.5rem;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`,
);

const StyledDialogContent = styled(DialogContent)(
  ({ theme }) => `
  width: 500px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border-top: 1px solid ${theme.palette.border.lines};
  border-left: 1px solid ${theme.palette.border.lines};
  border-right: 1px solid ${theme.palette.border.lines};
  background: ${theme.palette.background.secondary};
  padding: 1rem 1.5rem 0px;
  overflow-x: hidden;
`,
);

const StyledDialogActions = styled(DialogActions)(
  ({ theme }) => `
  width: 500px;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  border-bottom: 1px solid ${theme.palette.border.lines};
  border-left: 1px solid ${theme.palette.border.lines};
  border-right: 1px solid ${theme.palette.border.lines};
  background: ${theme.palette.background.secondary};
  padding: 0px 1rem 1rem;
  justify-content: flex-end;
`,
);

export const StyledTipsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  padding: '16px',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: `${theme.palette.border.tips}`,
  borderRadius: '8px',
  marginTop: '16px',
  backgroundColor: `${theme.palette.background.tips}`,
  width: '452px',
  gap: '12px',
}));

export default function InputVersionDialog({
  title = CREATE_VERSION,
  doButtonTitle = SAVE,
  showTips = false,
  versionName = '',
  disabled,
  open,
  onCancel,
  onConfirm,
  onChange,
}) {
  const onEnterDown = useCallback(
    event => {
      if (!disabled) {
        event.stopPropagation();
        event.preventDefault();
        onConfirm();
      }
    },
    [disabled, onConfirm],
  );

  const { onKeyDown, onKeyUp, onCompositionStart, onCompositionEnd } = useCtrlEnterKeyEventsHandler({
    onEnterDown,
  });

  const handleDialogKeyDown = useCallback(
    event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    },
    [onCancel],
  );

  return (
    <React.Fragment>
      <StyledDialog
        open={open}
        onKeyDown={handleDialogKeyDown}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <StyledDialogContent>
          <Title>{title}</Title>
          {showTips && (
            <StyledTipsContainer>
              <Box>
                <FrameIcon
                  width={16}
                  height={16}
                />
              </Box>
              <Typography
                variant="bodySmall"
                color="text.tips"
              >
                {
                  'Before your version of this prompt is published, it will be sent to the moderator to obtain his approval to publish.'
                }
              </Typography>
            </StyledTipsContainer>
          )}
          <StyledInput
            fullWidth
            variant="standard"
            label="Name"
            autoComplete="off"
            value={versionName}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            onChange={onChange}
            inputProps={{ maxLength: MAX_VERSION_LENGTH }}
          />
        </StyledDialogContent>
        <StyledDialogActions>
          <Button
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={disabled}
            onClick={onConfirm}
            autoFocus
          >
            {doButtonTitle}
          </Button>
        </StyledDialogActions>
      </StyledDialog>
    </React.Fragment>
  );
}
