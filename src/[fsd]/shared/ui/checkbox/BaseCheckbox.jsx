import { forwardRef, memo } from 'react';

import { Checkbox as MuiCheckbox, Radio as MuiRadio, SvgIcon } from '@mui/material';

import CheckboxCheckedIcon from '@/assets/checkbox-checked-icon.svg?react';
import CheckboxEmptyIcon from '@/assets/checkbox-empty-icon.svg?react';
import CheckboxIndeterminateIcon from '@/assets/checkbox-indeterminate-icon.svg?react';

export const CHECKBOX_MODES = {
  checkbox: 'checkbox',
  radio: 'radio',
};

export const CHECKBOX_VARIANTS = {
  elitea: 'elitea',
};

const BaseCheckbox = memo(
  forwardRef((props, ref) => {
    const { mode = CHECKBOX_MODES.checkbox, variant = CHECKBOX_VARIANTS.elitea, ...restProps } = props;

    if (mode === CHECKBOX_MODES.radio) {
      return (
        <MuiRadio
          ref={ref}
          variant={variant}
          disableRipple
          {...restProps}
        />
      );
    }

    return (
      <MuiCheckbox
        ref={ref}
        variant={variant}
        disableRipple
        icon={
          <SvgIcon
            component={CheckboxEmptyIcon}
            inheritViewBox
          />
        }
        checkedIcon={
          <SvgIcon
            component={CheckboxCheckedIcon}
            inheritViewBox
          />
        }
        indeterminateIcon={
          <SvgIcon
            component={CheckboxIndeterminateIcon}
            inheritViewBox
          />
        }
        {...restProps}
      />
    );
  }),
);

BaseCheckbox.displayName = 'BaseCheckbox';

export default BaseCheckbox;

export const CHECKBOX_STATES = {
  default: 'default',
  hover: 'hover',
  disabled: 'disabled',
};

export const eliteaCheckboxColors = theme => {
  return {
    checkbox: {
      [CHECKBOX_STATES.default]: {
        off: theme.palette.checkbox.default,
        on: theme.palette.checkbox.active,
        indeterminate: theme.palette.checkbox.active,
        mark: theme.palette.checkbox.mark,
      },
      [CHECKBOX_STATES.hover]: {
        off: theme.palette.checkbox.hover.off,
        on: theme.palette.checkbox.hover.on,
        indeterminate: theme.palette.checkbox.hover.on,
        mark: theme.palette.checkbox.mark,
      },
      [CHECKBOX_STATES.disabled]: {
        color: theme.palette.checkbox.disabled,
        mark: theme.palette.checkbox.mark,
      },
    },
    radio: {
      [CHECKBOX_STATES.default]: {
        off: theme.palette.radio.default,
        on: theme.palette.radio.active,
      },
      [CHECKBOX_STATES.hover]: {
        off: theme.palette.radio.hover.off,
      },
      [CHECKBOX_STATES.disabled]: theme.palette.radio.disabled,
    },
  };
};

export const eliteaCheckboxVariants = [
  {
    props: { variant: CHECKBOX_VARIANTS.elitea },
    style: ({ theme }) => {
      const colors = eliteaCheckboxColors(theme).checkbox;

      return {
        '& .MuiSvgIcon-root': {
          fontSize: '1rem',
        },

        '&&:not(.Mui-checked):not(.MuiCheckbox-indeterminate) .MuiSvgIcon-root': {
          color: colors.default.off,
          fill: 'none',
        },
        '&&.Mui-checked .MuiSvgIcon-root': {
          color: colors.default.on,
        },
        '&&.Mui-checked .MuiSvgIcon-root path, &&.MuiCheckbox-indeterminate .MuiSvgIcon-root path': {
          fill: 'none',
          stroke: colors.default.mark,
        },
        '&&.MuiCheckbox-indeterminate .MuiSvgIcon-root': {
          color: colors.default.indeterminate,
        },

        '&&:hover:not(.Mui-disabled)': {
          backgroundColor: 'transparent',

          '&:not(.Mui-checked):not(.MuiCheckbox-indeterminate) .MuiSvgIcon-root': {
            color: colors.hover.off,
            fill: 'none',
          },
          '&.Mui-checked .MuiSvgIcon-root': {
            color: colors.hover.on,
          },
          '&.MuiCheckbox-indeterminate .MuiSvgIcon-root': {
            color: colors.hover.indeterminate,
          },
          '&.Mui-checked .MuiSvgIcon-root path, &.MuiCheckbox-indeterminate .MuiSvgIcon-root path': {
            fill: 'none',
            stroke: colors.hover.mark,
          },
        },

        '&&.Mui-focusVisible': {
          backgroundColor: 'transparent',
        },

        '&&.Mui-disabled': {
          '&:not(.Mui-checked):not(.MuiCheckbox-indeterminate) .MuiSvgIcon-root': {
            color: colors.disabled.color,
            fill: 'none',
          },
          '&.Mui-checked .MuiSvgIcon-root': {
            color: colors.disabled.color,
          },
          '&.MuiCheckbox-indeterminate .MuiSvgIcon-root': {
            color: colors.disabled.color,
          },
          '&.Mui-checked .MuiSvgIcon-root path, &.MuiCheckbox-indeterminate .MuiSvgIcon-root path': {
            fill: 'none',
            stroke: colors.disabled.mark,
          },
        },
      };
    },
  },

  // Size Variants
  {
    props: { size: 'xs' },
    style: {
      padding: '0.25rem',
      '& .MuiSvgIcon-root': {
        fontSize: '0.75rem',
      },
    },
  },
  {
    props: { size: 'small' },
    style: {
      padding: '0.375rem',
      '& .MuiSvgIcon-root': {
        fontSize: '0.875rem',
      },
    },
  },
  {
    props: { size: 'medium' },
    style: {
      padding: '0.5rem',
      '& .MuiSvgIcon-root': {
        fontSize: '1rem',
      },
    },
  },
  {
    props: { size: 'large' },
    style: {
      padding: '0.625rem',
      '& .MuiSvgIcon-root': {
        fontSize: '1.25rem',
      },
    },
  },
  {
    props: { size: 'xl' },
    style: {
      padding: '0.75rem',
      '& .MuiSvgIcon-root': {
        fontSize: '1.5rem',
      },
    },
  },
];

export const eliteaUnifiedRadioVariants = [
  {
    props: { variant: CHECKBOX_VARIANTS.elitea },
    style: ({ theme }) => {
      const colors = eliteaCheckboxColors(theme).radio;

      return {
        '&&': {
          size: '1rem',
          color: colors.default.off,

          '&.Mui-checked': {
            color: colors.default.on,
          },

          '&:hover:not(.Mui-disabled)': {
            backgroundColor: 'transparent',
            color: colors.hover.off,
          },

          '&.Mui-disabled': {
            color: colors.disabled,
            '&.Mui-checked': {
              color: colors.disabled,
            },
          },

          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem',
          },
        },
      };
    },
  },
];
