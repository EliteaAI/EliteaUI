export const INPUT_VARIANTS = {
  standard: 'standard',
};

export const eliteaInputVariants = inputBodyMediumStyles => [
  {
    props: { variant: INPUT_VARIANTS.standard },
    style: ({ theme }) => ({
      '& input': {
        ...inputBodyMediumStyles,
        color: theme.palette.text.secondary,
      },
    }),
  },
];

export const eliteaTextFieldColorStyle = theme => ({
  [INPUT_VARIANTS.standard]: {
    default: {
      label: {
        color: theme.palette.text.primary,
      },
      placeholder: {
        color: theme.palette.text.participant.default,
      },
      input: {
        color: theme.palette.text.secondary,
      },
      textarea: {
        color: theme.palette.text.secondary,
      },
      underline: {
        color: theme.palette.border.lines,
      },
    },
    hover: {
      underline: {
        color: theme.palette.border.hover,
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
      textarea: {
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

/** @type {MuiSx} */
export const eliteaTextFieldStyle = () => ({
  padding: '0.5rem 0 0 0',
  '& .MuiFormLabel-root': {
    left: '0.75rem',
    top: '0.65rem',
  },
  '& .MuiFormLabel-root:not(.MuiInputLabel-shrink)': {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  '& .MuiFormLabel-root.MuiInputLabel-shrink': {
    top: '0.5rem',
    fontSize: '1rem',
    fontWeight: 500,
  },
  '& .MuiInputLabel-shrink .MuiBox-root:has(> svg)': {
    width: 16,
    height: 16,
    minWidth: 16,
    minHeight: 16,
    overflow: 'visible',
    transform: 'scale(1.3334)',
    transformOrigin: 'center',
  },
  '& .MuiInputLabel-root': {
    maxWidth: '100%',
    '&:not(.MuiInputLabel-shrink)': {
      maxWidth: 'calc(100% - 1.5rem)',
    },
  },
  '& .MuiInputBase-root': {
    position: 'relative',
  },
  '& .MuiInputBase-input': {
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
  },
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
  '& input': {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    height: '1.5rem',
    boxSizing: 'border-box',
    marginBottom: '0.5rem',
  },
  '& textarea': {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    boxSizing: 'border-box',
    marginBottom: '0.5rem',
  },
  '& .MuiInput-underline': {
    padding: '0.25rem 0.75rem 0',
  },
});

export const eliteaTextFieldVariants = [
  {
    props: { variant: INPUT_VARIANTS.standard },
    style: ({ theme }) => {
      const colors = eliteaTextFieldColorStyle(theme)[INPUT_VARIANTS.standard];
      const baseStyles = eliteaTextFieldStyle();
      return {
        ...baseStyles,

        '& label, & label.Mui-error, .MuiFormLabel-asterisk.Mui-error': {
          color: colors.default.label.color,
        },

        '& :not(.Mui-error) label.Mui-focused': {
          color: colors.active.label.color,
        },

        '& label.Mui-disabled': {
          color: colors.disabled.label.color,
        },

        '& input::placeholder, & textarea::placeholder': {
          color: colors.default.placeholder.color,
          opacity: 1,
        },

        '& input': {
          ...baseStyles['& input'],
          color: colors.default.input.color,
        },

        '& input.Mui-disabled ': {
          ...baseStyles['& input'],
          color: colors.disabled.input.color,
          WebkitTextFillColor: colors.disabled.input.color,
        },

        '& textarea': {
          ...baseStyles['& textarea'],
          color: colors.default.textarea.color,
        },

        '& .Mui-disabled textarea': {
          color: colors.disabled.textarea.color,
        },

        '&:has(.MuiInputBase-root.Mui-disabled)': {
          cursor: 'not-allowed',
        },
        '& .MuiInputBase-root.Mui-disabled': {
          cursor: 'not-allowed',
        },
        '& .MuiInputBase-root.Mui-disabled input, & .MuiInputBase-root.Mui-disabled textarea': {
          cursor: 'not-allowed',
        },
        '& .MuiFormLabel-root.Mui-disabled': {
          cursor: 'not-allowed',
        },

        '& :not(.Mui-error).MuiInput-underline:before': {
          borderBottomColor: colors.default.underline.color,
          borderBottomWidth: '0.0625rem',
        },

        '& :not(.Mui-error, .Mui-disabled).MuiInput-underline:hover:before': {
          borderBottomColor: colors.hover.underline.color,
          borderBottomWidth: '0.0625rem',
        },

        '& :not(.Mui-error).MuiInput-underline.Mui-focused:after': {
          borderBottomColor: colors.active.underline.color,
          borderBottomWidth: '0.0625rem',
        },

        '& :not(.Mui-error).MuiInput-underline.Mui-disabled:before': {
          borderBottomColor: colors.disabled.underline.color,
          borderBottomWidth: '0.0625rem',
          borderBottomStyle: 'solid',
        },

        '& .Mui-error.MuiInput-underline:before': {
          borderBottomColor: colors.error.underline.color,
          borderBottomWidth: '0.0625rem',
          borderBottomStyle: 'solid',
        },
        '& .Mui-error.MuiInput-underline:after': {
          borderBottomColor: colors.error.underline.color,
          borderBottomWidth: '0.0625rem',
          borderBottomStyle: 'solid',
        },
        '& .MuiFormHelperText-root.Mui-error': {
          color: colors.error.helperText.color,
          paddingLeft: '0.75rem',
        },
      };
    },
  },
];
