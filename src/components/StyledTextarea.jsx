// import { TextareaAutosize as BaseTextareaAutosize } from '@mui/base/TextareaAutosize';
import BaseTextareaAutosize from '@mui/material/TextareaAutosize';

import styled from '@emotion/styled';

export const StyledTextareaAutosize = styled(BaseTextareaAutosize)(
  ({ theme }) => `
  margin-top: 8px;
  padding: 8px 16px;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 100%;
  height: 133px;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  font-family: Montserrat;
  line-height: 24px;
  padding: 8px 12px;
  border-radius: 8px;
  color: ${theme.palette.text.secondary};
  border: 1px solid ${theme.palette.border.lines};
  background: none;
  // firefox
  &:focus-visible {
    outline: 0;
  }
  overflow: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
  ::-webkit-scrollbar {
    width: 0 !important;
    height: 0;
  }
`,
);
