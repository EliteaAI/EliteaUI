import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';

import styled from '@emotion/styled';

export const StyledDialogBase = styled(Dialog)(
  ({ theme }) => `
  & .MuiDialog-paper {
    border-radius: 0.5rem;
    border: 1px solid ${theme.palette.border.lines};
    background: ${theme.palette.background.secondary};
  }
`,
);

export const StyledDialog = styled(StyledDialogBase)`
  & .MuiDialog-paper {
    display: flex;
    width: 28.75rem;
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const StyledDialogContentText = styled(DialogContentText)(
  ({ theme }) => `
  color: ${theme.palette.text.deleteAlertText};
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 400;
  line-height: 1.5rem;
`,
);

export const StyledDialogActions = styled(DialogActions)(
  () => `
  justify-content: flex-end;
  align-self: flex-end;
  padding: 0.5rem 1.5rem 1.5rem 1.5rem;
`,
);
