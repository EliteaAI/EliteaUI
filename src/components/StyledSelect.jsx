import { Select } from '@mui/material';

import { filterProps } from '@/common/utils';
import styled from '@emotion/styled';

const StyledSelect = styled(
  Select,
  filterProps('customSelectedColor', 'customSelectedFontSize'),
)(
  ({ customSelectedColor, customSelectedFontSize, theme }) => `
  display: flex;
  height: 1.88rem;
  padding: 0.25rem 0rem;
  align-items: center;
  gap: 0.625rem;
  & .MuiOutlinedInput-notchedOutline {
    border-width: 0px;
  }
  & .Mui-focused .MuiOutlinedInput-notchedOutline {
    border: 0px solid white;
  }
  & .MuiOutlinedInput-input {
    padding: 0.25rem 0 0.5rem;
  }
  & .MuiSelect-icon {
    top: calc(50% - 11px);
  }
  & .MuiSelect-select {
    color: ${customSelectedColor || theme.palette.text.select.selected.primary};
    font-size: ${customSelectedFontSize || '1rem'};
  }
  & .MuiSelect-select:focus {
    background-color: transparent;
  }
  & .MuiInput-input {
    display: flex;
    align-items: center;
  }
  & .MuiInput-input.Mui-disabled {
    color: ${theme.palette.text.default} !important;
    -webkit-text-fill-color: ${theme.palette.text.default} !important;
  }
  fieldset{
    border: none !important;
    outline: none !important;
  };
`,
);
export default StyledSelect;
