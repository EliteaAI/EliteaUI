export const INPUT_VARIANTS = {
  default: 'default',
};

export const eliteaSingleSelectColorStyle = theme => ({
  [INPUT_VARIANTS.default]: {
    default: {
      label: {
        color: theme.palette.text.primary,
      },
      placeholder: {
        color: theme.palette.text.default,
      },
      input: {
        color: theme.palette.text.secondary,
      },
      selectValue: {
        color: theme.palette.text.select.selected.primary,
      },
      underline: {
        color: theme.palette.border.lines,
      },
    },
    hover: {
      underline: {
        color: theme.palette.border.hover,
      },
      withoutBorder: {
        color: theme.palette.border.flowNode,
      },
    },
    active: {
      label: {
        color: theme.palette.primary.main,
      },
      underline: {
        color: theme.palette.primary.main,
      },
    },
    disabled: {
      label: {
        color: theme.palette.text.button.disabled,
      },
      input: {
        color: theme.palette.text.default,
      },
      underline: {
        color: theme.palette.border.lines,
      },
    },
    error: {
      underline: {
        color: theme.palette.icon.fill.error,
      },
      helperText: {
        color: theme.palette.icon.fill.error,
      },
    },
  },
});

const getSingleSelectInputStateSx = theme => {
  const colors = eliteaSingleSelectColorStyle(theme)[INPUT_VARIANTS.default];

  return {
    '&.MuiInput-underline:before': {
      borderBottom: `0.0625rem solid ${colors.default.underline.color}`,
    },
    '&:not(.Mui-error).MuiInput-underline.Mui-focused:after': {
      borderBottom: `0.0625rem solid ${colors.active.underline.color}`,
    },
    '&:not(.Mui-error).MuiInput-underline.Mui-disabled:before': {
      borderBottom: `0.0625rem solid ${colors.disabled.underline.color}`,
    },
    '&.Mui-error.MuiInput-underline:before': {
      borderBottom: `0.0625rem solid ${colors.error.underline.color}`,
    },
    '&.Mui-error.MuiInput-underline:after': {
      borderBottom: `0.0625rem solid ${colors.error.underline.color}`,
    },
    '& .MuiSelect-select': {
      color: colors.default.selectValue.color,
      fontSize: '1rem',
    },
    '& .MuiSelect-select:focus': {
      backgroundColor: 'transparent',
    },
    '& .MuiInput-input.Mui-disabled, &.Mui-disabled .MuiSelect-select': {
      color: `${colors.disabled.input.color} !important`,
      WebkitTextFillColor: `${colors.disabled.input.color} !important`,
      cursor: 'not-allowed',
    },
  };
};

export const getSingleSelectShowBorderSx = theme => {
  const colors = eliteaSingleSelectColorStyle(theme)[INPUT_VARIANTS.default];

  return {
    '& .MuiSelect-icon': {
      marginRight: '.75rem',
    },
    verticalAlign: 'bottom',
    '& .MuiInputBase-root.MuiInput-root': {
      padding: '0.75rem',
      marginTop: '1.25rem',
    },
    '& label, & label.Mui-error, .MuiFormLabel-asterisk.Mui-error': {
      color: colors.default.label.color,
    },
    '& label.Mui-disabled': {
      color: colors.disabled.label.color,
    },
    '& .MuiInputBase-root.MuiInput-root:not(.Mui-error, .Mui-disabled).MuiInput-underline:hover:before': {
      borderBottom: `0.0625rem solid ${colors.hover.underline.color}`,
    },
    '& :not(.Mui-error) label.Mui-focused': {
      color: colors.active.label.color,
    },
    '& .MuiFormHelperText-root.Mui-error': {
      color: colors.error.helperText.color,
      paddingLeft: '0.75rem',
    },
    '&:has(.MuiInputBase-root.Mui-disabled)': {
      cursor: 'not-allowed',
    },
    '& .MuiInputBase-root.Mui-disabled': {
      cursor: 'not-allowed',
    },
    '& .MuiFormLabel-root.Mui-disabled': {
      cursor: 'not-allowed',
    },
  };
};

export const getSingleSelectWithoutBorderSx = theme => {
  const colors = eliteaSingleSelectColorStyle(theme)[INPUT_VARIANTS.default];

  return {
    margin: '0 0.5rem',
    verticalAlign: 'bottom',
    '& label, & label.Mui-error, .MuiFormLabel-asterisk.Mui-error': {
      color: colors.default.label.color,
    },
    '& label.Mui-disabled': {
      color: colors.disabled.label.color,
    },
    '& .MuiInputBase-root.MuiInput-root:before': {
      border: 'none',
    },
    '& .MuiInputBase-root.MuiInput-root:not(.Mui-error).MuiInput-underline:before': {
      borderBottomColor: 'transparent',
    },
    '& .MuiSelect-select': {
      paddingRight: '1.5rem !important',
    },
    '& .MuiInputBase-root.MuiInput-root:not(.Mui-error, .Mui-disabled).MuiInput-underline:hover:before': {
      borderBottom: `0.0625rem solid ${colors.hover.withoutBorder.color}`,
    },
    '& .MuiInputBase-root.MuiInput-root.Mui-disabled:before': {
      border: 'none',
    },
    '& .MuiFormHelperText-root.Mui-error': {
      color: colors.error.helperText.color,
      paddingLeft: '0.75rem',
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        border: 'none',
      },
      '&:hover fieldset': {
        border: 'none',
      },
      '&.Mui-focused fieldset': {
        border: 'none',
      },
    },
  };
};

export const eliteaSingleSelectVariants = [
  {
    props: { variant: 'standard' },
    style: ({ theme }) => {
      return {
        ...getSingleSelectInputStateSx(theme),
        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
          border: '0px solid white',
        },
        '& fieldset': {
          border: 'none !important',
          outline: 'none !important',
        },
      };
    },
  },
];
