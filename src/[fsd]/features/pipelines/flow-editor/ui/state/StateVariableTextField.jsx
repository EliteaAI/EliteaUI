import { memo } from 'react';

import { TextField } from '@mui/material';

const StateVariableTextField = memo(props => {
  const {
    value,
    onChange,
    onBlur,
    onKeyDown,
    autoFocus = false,
    error = false,
    placeholder = '',
    width = '10.125rem',
    disabled,
  } = props;

  const styles = stateVariableTextFieldStyles(error, width);

  return (
    <TextField
      value={value}
      onChange={onChange}
      onBlur={!disabled ? onBlur : undefined}
      onKeyDown={!disabled ? onKeyDown : undefined}
      autoFocus={autoFocus}
      size="small"
      error={error}
      placeholder={placeholder}
      sx={styles.textField}
      disabled={disabled}
    />
  );
});

StateVariableTextField.displayName = 'StateVariableTextField';

export default StateVariableTextField;

/** @type {MuiSx} */
const stateVariableTextFieldStyles = (hasError, width) => ({
  textField: ({ palette, spacing }) => ({
    width,
    minWidth: width,
    '& .MuiInputBase-root': {
      height: spacing(4),
      padding: spacing(0.5, 1.25),
      borderRadius: spacing(1),
      background: palette.background.userInputBackground,
      fontSize: '.875rem',
      color: palette.text.secondary,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: hasError ? palette.error.main : 'transparent',
      borderWidth: '.0625rem',
    },
    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: hasError ? palette.error.main : palette.border.lines,
      borderWidth: '.0625rem',
    },
    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: hasError ? palette.error.main : palette.primary.main,
      borderWidth: '.0625rem',
    },
    '& .MuiInputBase-input': {
      padding: 0,
      color: palette.text.secondary,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .MuiInputBase-input::placeholder': {
      color: palette.secondary.main,
      opacity: 1,
    },
  }),
});
