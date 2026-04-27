import { Box, ListItem } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

import StyledCircleProgress from '@/ComponentsLib/CircularProgress';

export const ChatBoxContainer = styled(Box)(() => ({
  width: '100%',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  height: 'calc(100% - 40px)',
  boxSizing: 'border-box',
}));

export const ActionContainer = styled(Box)(() => ({
  width: '100%',
  height: '28px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  boxSizing: 'border-box',
}));

export const ChatBodyContainer = styled(Box)(
  ({ theme }) => `
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1 0 0;
  flex-grow: 1;
  align-self: stretch;

  position: relative;

  border-radius: 16px;
  border: 1px solid ${theme.palette.border.lines};
  background: ${theme.palette.background.alitaDefault};
  box-sizing: border-box;
`,
);

export const ChatInputContainer = styled(Box)(
  ({ theme }) => `
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 0.75rem 1rem;
  align-items: flex-start;
  border-radius: 0rem 0rem 0.375rem 0.375rem;
  border-top: 1px solid ${theme.palette.border.lines};
  background: ${theme.palette.background.userInputBackground};
`,
);

export const StyledTextField = styled(TextField)(() => ({
  flex: `1 0 0`,
  fontSize: '0.875rem',
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: '1.375rem',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  msOverflowStyle: 'none' /* IE and Edge */,
  scrollbarWidth: 'none',
  '& textarea::-webkit-scrollbar': {
    display: 'none',
  },
}));

export const SendButtonContainer = styled(Box)(
  () => `
  display: flex;
  height: auto;
  align-items: center;
  justify-content: center;
`,
);

export const SendButton = styled(IconButton)(
  ({ theme }) => `
  box-sizing: border-box;
  height: 28px;
  width: 28px;
  display: flex;
  padding: 0.375rem;
  justify-content: center;
  align-items: center;
  border-radius: 1.75rem;
  background: ${theme.palette.primary.main};
  &.Mui-disabled {
    background-color: ${theme.palette.background.button.primary.disabled};
  }
  &:hover {
    background: ${theme.palette.primary.main}
  }
`,
);

export { StyledCircleProgress };

export const MessageList = styled(List)(
  () => `
  width: 100%;
  flex-grow: 1;
  height: 200px;
  padding: 0 0.75rem 0.75rem;
  overflow: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
  ::-webkit-scrollbar {
    width: 0 !important;
    height: 0;
  }
`,
);

export const CompletionContainer = styled(Box)(
  () => `
  padding: 0.75rem;
  width: 100%;
  height: 24.25rem;
  overflow: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
  ::-webkit-scrollbar {
    width: 0 !important;
    height: 0;
  }
`,
);

export const Message = styled(Box)(
  () => `
  flex: 1 0 0;
  color: #FFF;
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 400;
  line-height: 1.375rem; /* 157.143% */
  overflow-wrap: break-word;
  word-break: break-word;
`,
);

/**
 * Shared styled components for chat messages to avoid duplication between
 * ApplicationAnswer and UserMessage components
 */

export const UserMessageContainer = styled(ListItem)(() => ({
  flex: '1 0 0',
  display: 'flex',
  padding: '0.75rem',
  alignItems: 'flex-start',
  gap: '1rem',
  alignSelf: 'stretch',
  borderRadius: '0.25rem',
  '&:not(:last-of-type)': {
    marginBottom: '8px',
  },
}));

export const Answer = styled(Box)(
  ({ theme }) => `
  min-height: 32px; 
  flex: 1 0 0;
  color:${theme.palette.text.secondary};
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 400;
  line-height: 1.375rem; /* 157.143% */
  overflow-wrap: break-word;
  word-break: break-word;
  background: transparent;
  overflow-x: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
  ::-webkit-scrollbar {
    width: 0 !important;
    height: 0;
  }
`,
);

export const ButtonsContainer = styled(Box)(
  ({ theme }) => `
position: absolute;
top: 6px;
right: 6px;
display: flex;
justify-content: flex-end;
align-items: flex-start;
gap: 0.5rem;
padding-left: 32px;
padding-bottom: 2px;
background: ${theme.palette.background.aiAnswerActions};
`,
);

// Alternative ButtonsContainer variant for UserMessage (no absolute positioning)
export const RelativeButtonsContainer = styled(Box)(
  () => `
display: flex;
justify-content: flex-end;
align-items: flex-start;
gap: 0.5rem;
margin-top: 8px;
padding-left: 32px;
padding-bottom: 2px;
`,
);

// Alternative UserMessageContainer variant for UserMessage (with margin-bottom always applied)
export const UserMessageContainerWithMargin = styled(ListItem)(
  () => `
  flex: 1 0 0;
  display: flex;
  padding: 0.75rem;
  align-items: flex-start;
  gap: 1rem;
  align-self: stretch;
  border-radius: 0.25rem;
  margin-bottom: 8px;
`,
);
