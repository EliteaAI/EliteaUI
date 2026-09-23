import { forwardRef, memo } from 'react';

import { Button as MuiButton } from '@mui/material';

export const BUTTON_COLORS = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  alarm: 'alarm',
};

export const BUTTON_VARIANTS = {
  elitea: 'elitea',
  contained: 'contained',
  secondary: 'secondary',
  text: 'text',
  special: 'special',
  alarm: 'alarm',
  auxiliary: 'auxiliary',
  icon: 'icon',
  iconCounter: 'iconCounter',
  maxi: 'maxi',
  iconLabel: 'iconLabel',
  tertiary: 'tertiary',
  neutral: 'neutral',
  positive: 'positive',
};

const BaseBtn = memo(
  forwardRef((props, ref) => {
    const { children, loadingPosition = 'end', ...restProps } = props;
    const isIconOnly =
      (children === undefined || children === null) && (restProps.startIcon || restProps.loading);

    return (
      <MuiButton
        ref={ref}
        loadingPosition={isIconOnly ? 'center' : loadingPosition}
        {...restProps}
      >
        {children}
      </MuiButton>
    );
  }),
);

BaseBtn.displayName = 'BaseBtn';

export default BaseBtn;

export const eliteaButtonColors = theme => ({
  [BUTTON_VARIANTS.special]: {
    default: {
      background: theme.palette.components.button.background.split.default,
      color: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.text.secondary,
    },
    hover: {
      background: theme.palette.components.button.background.split.hover,
    },
    active: {
      background: theme.palette.components.button.background.split.pressed,
      color: theme.palette.components.split.text.pressed,
    },
    disabled: {
      background: theme.palette.components.button.background.default,
      color: theme.palette.text.primary,
    },
  },
  [BUTTON_VARIANTS.contained]: {
    default: {
      background: theme.palette.components.button.background.primary.default,
      color: theme.palette.components.button.text.primary,
    },
    hover: { background: theme.palette.components.button.background.primary.hover },
    active: { background: theme.palette.components.button.background.primary.pressed },
    disabled: {
      background: theme.palette.components.button.background.primary.disabled,
      color: theme.palette.components.button.text.primary,
    },
  },
  [BUTTON_VARIANTS.secondary]: {
    default: {
      background: theme.palette.components.button.background.secondary.default,
      color: theme.palette.text.secondary,
      border: '0.0625rem solid transparent',
    },
    hover: { background: theme.palette.components.button.background.secondary.hover },
    active: {
      background: theme.palette.components.button.background.secondary.pressed,
      color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary,
      border: `0.0625rem solid ${theme.palette.border.lines}`,
    },
    disabled: {},
  },
  [BUTTON_VARIANTS.iconCounter]: {
    default: {
      background: theme.palette.components.button.background.secondary.default,
      color: theme.palette.text.secondary,
    },
    hover: {
      background: theme.palette.components.button.background.secondary.hover,
    },
    active: {
      background:
        theme.palette.mode === 'dark'
          ? theme.palette.components.button.background.secondary.default
          : theme.palette.components.button.background.secondary.pressed,
    },
    disabled: {
      background: theme.palette.components.button.background.default,
      color: theme.palette.components.button.text.disabled,
    },
  },
  [BUTTON_VARIANTS.iconLabel]: {
    default: {
      background: theme.palette.components.button.background.iconLabelButton.default,
      color: theme.palette.text.secondary,
    },
    hover: {
      background: theme.palette.components.button.background.tertiary.hover,
    },
    active: {
      background: theme.palette.components.button.background.tertiary.pressed,
      color: theme.palette.text.primary,
    },
    disabled: {
      background: theme.palette.components.button.background.default,
      color: theme.palette.components.button.text.disabled,
    },
  },
  [BUTTON_VARIANTS.tertiary]: {
    default: { background: 'transparent', color: theme.palette.text.primary },
    hover: {
      background: theme.palette.components.button.background.tertiary.hover,
      color: theme.palette.text.secondary,
    },
    active: {
      color: theme.palette.text.primary,
      background: theme.palette.components.button.background.tertiary.pressed,
    },
    disabled: { color: theme.palette.components.button.text.disabled, background: 'transparent' },
  },
  [BUTTON_VARIANTS.auxiliary]: {
    default: {
      background: 'transparent',
      color: theme.palette.components.button.text.showMore,
      colorIcon: theme.palette.secondary.main,
    },
    hover: {
      color: theme.palette.components.button.text.auxiliary,
      colorIcon: theme.palette.text.secondary,
    },
    active: {
      color:
        theme.palette.mode === 'dark'
          ? theme.palette.components.button.text.disabled
          : theme.palette.secondary.main,
      colorIcon: theme.palette.secondary.main,
    },
    disabled: {
      background: 'transparent',
      color: theme.palette.components.button.text.disabled,
      colorIcon: theme.palette.components.button.text.disabled,
    },
  },
  [BUTTON_VARIANTS.alarm]: {
    default: {
      background: theme.palette.components.button.background.alarm.default,
      color: theme.palette.text.alwaysWhite,
    },
    hover: {
      background: theme.palette.components.button.background.alarm.hover,
      color: theme.palette.text.alwaysWhite,
    },
    active: {
      background: theme.palette.components.button.background.alarm.pressed,
      color: theme.palette.text.alwaysWhite,
    },
    disabled: {
      background: theme.palette.components.button.background.alarm.disabled,
      color: theme.palette.text.alwaysWhite,
    },
  },
  [BUTTON_VARIANTS.neutral]: {
    default: {
      background: theme.palette.components.button.background.neutral.default,
      color: theme.palette.text.alwaysWhite,
    },
    hover: {
      background: theme.palette.components.button.background.neutral.hover,
      color: theme.palette.text.alwaysWhite,
    },
    active: {
      background: theme.palette.components.button.background.neutral.pressed,
      color: theme.palette.text.alwaysWhite,
    },
    disabled: {
      background: theme.palette.components.button.background.neutral.disabled,
      color: theme.palette.text.alwaysWhite,
    },
  },
  [BUTTON_VARIANTS.positive]: {
    default: {
      background: theme.palette.components.button.background.positive.default,
      color: theme.palette.text.alwaysWhite,
    },
    hover: {
      background: theme.palette.components.button.background.positive.hover,
      color: theme.palette.text.alwaysWhite,
    },
    active: {
      background: theme.palette.components.button.background.positive.pressed,
      color: theme.palette.text.alwaysWhite,
    },
    disabled: {
      background: theme.palette.components.button.background.positive.disabled,
      color: theme.palette.text.alwaysWhite,
    },
  },
});

const getIsIconOnly = ownerState =>
  Boolean(
    ownerState &&
    (ownerState.children === undefined || ownerState.children === null) &&
    (ownerState.startIcon || ownerState.loading),
  );

const baseVariantStyle = (theme, ownerState, options = {}) => {
  const isIconOnly = getIsIconOnly(ownerState);

  return {
    ...theme.typography.labelSmall,
    height: '1.75rem',
    boxShadow: 'none',
    border: '0.0625rem solid transparent',
    gap: '0.5rem',
    '& .MuiButton-startIcon': {
      margin: 0,
      width: '1rem',
      height: '1rem',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...(options.iconOnly && isIconOnly && ownerState.loading && { visibility: 'hidden' }),

      '& > svg': {
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
      },
    },

    ...(options.iconOnly && isIconOnly
      ? {
          minWidth: 'auto',
          width: '1.75rem',
          borderRadius: '50%',
          padding: 0,
        }
      : {}),
  };
};

export const eliteaButtonVariants = [
  {
    props: { variant: BUTTON_VARIANTS.special },
    style: ({ theme, ownerState }) => ({
      ...baseVariantStyle(theme, ownerState, { iconOnly: true }),
      ...(ownerState.children != null && ownerState.startIcon != null && { paddingLeft: '0.75rem' }),
      backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.special].default.background,
      color: eliteaButtonColors(theme)[BUTTON_VARIANTS.special].default.color,

      '&:hover': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.special].hover.background,
      },
      '&:focus-visible': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.special].hover.background,
      },

      '&:active': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.special].active.background,
      },

      '&:disabled': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.special].disabled.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.special].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.contained },
    style: ({ theme, ownerState }) => ({
      ...baseVariantStyle(theme, ownerState, { iconOnly: true }),
      backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.contained].default.background,
      color: eliteaButtonColors(theme)[BUTTON_VARIANTS.contained].default.color,
      '&:hover': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.contained].hover.background,
        boxShadow: 'none',
      },
      '&:focus-visible': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.contained].hover.background,
        boxShadow: 'none',
      },
      '&:active': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.contained].active.background,
      },
      '&:disabled': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.contained].disabled.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.contained].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.secondary },
    style: ({ theme, ownerState }) => ({
      ...baseVariantStyle(theme, ownerState, { iconOnly: true }),

      backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.secondary].default.background,
      color: eliteaButtonColors(theme)[BUTTON_VARIANTS.secondary].default.color,
      border: eliteaButtonColors(theme)[BUTTON_VARIANTS.secondary].default.border,
      '&:hover': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.secondary].hover.background,
      },
      '&:focus-visible': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.secondary].hover.background,
      },
      '&:active': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.secondary].active.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.secondary].active.color,
        border: eliteaButtonColors(theme)[BUTTON_VARIANTS.secondary].active.border,
      },
      '&:disabled': {
        backgroundColor: theme.palette.components.button.background.default,
        color: theme.palette.components.button.text.disabled,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.iconCounter },
    style: ({ theme }) => ({
      borderRadius: '1rem',
      padding: '0.375rem 0.625rem 0.375rem 0.5rem',
      minWidth: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.375rem',

      backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].default.background,
      color: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].default.color,

      '& .MuiButton-startIcon': {
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        '& > svg': {
          width: '1rem',
          height: '1rem',
          display: 'block',
        },
      },

      '& .MuiButton-endIcon': {
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        '& > span': {
          fontFamily: '"Montserrat", "Roboto", "Arial", sans-serif',
          fontWeight: 500,
          fontSize: '0.75rem',
          lineHeight: '1rem',
        },
      },

      '&:hover': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].hover.background,
      },
      '&:focus-visible': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].hover.background,
      },
      '&:active': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].active.background,
      },
      '&:disabled': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].disabled.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.iconLabel },
    style: ({ theme }) => ({
      ...baseVariantStyle(theme),
      gap: '0.375rem',
      borderRadius: '1rem',
      border: `0.0625rem solid ${theme.palette.border.lines}`,
      backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].default.background,
      color: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].default.color,
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem',
      '& .MuiButton-startIcon > svg': {
        width: '0.75rem',
        height: '0.75rem',
      },
      '&:hover': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].hover.background,
        border: '0.0625rem solid transparent',
      },
      '&:focus-visible': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].hover.background,
      },
      '&:active': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].active.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].active.color,
      },
      '&:disabled': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].default.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.tertiary },
    style: ({ theme, ownerState }) => {
      const isIconOnly = getIsIconOnly(ownerState);

      return {
        ...baseVariantStyle(theme, ownerState, { iconOnly: true }),
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.tertiary].default.color,
        background: eliteaButtonColors(theme)[BUTTON_VARIANTS.tertiary].default.background,
        minWidth: '1.75rem !important',
        borderRadius: '1rem',
        gap: '0.625rem',
        ...(isIconOnly
          ? {
              width: '1.75rem',
              padding: 0,
              gap: 0,
              '& .MuiButton-startIcon': {
                margin: '0 !important',
              },
            }
          : { padding: '0.375rem 1rem' }),

        '--btn-icon-fill': theme.palette.icon.default,
        '& .MuiButton-startIcon path': { fill: 'var(--btn-icon-fill)' },

        '&:hover': {
          '--btn-icon-fill': theme.palette.icon.secondary,
          background: eliteaButtonColors(theme)[BUTTON_VARIANTS.tertiary].hover.background,
          color: eliteaButtonColors(theme)[BUTTON_VARIANTS.tertiary].hover.color,
        },

        '&:focus-visible': {
          '--btn-icon-fill': theme.palette.icon.secondary,
          background: eliteaButtonColors(theme)[BUTTON_VARIANTS.tertiary].hover.background,
          color: eliteaButtonColors(theme)[BUTTON_VARIANTS.tertiary].hover.color,
        },

        '&:active': {
          color: eliteaButtonColors(theme)[BUTTON_VARIANTS.tertiary].active.color,
          background: eliteaButtonColors(theme)[BUTTON_VARIANTS.tertiary].active.background,
        },

        '&:disabled': {
          '--btn-icon-fill': theme.palette.icon.disabled,
          color: eliteaButtonColors(theme)[BUTTON_VARIANTS.tertiary].disabled.color,
          background: eliteaButtonColors(theme)[BUTTON_VARIANTS.tertiary].disabled.background,
        },
      };
    },
  },

  {
    props: { variant: BUTTON_VARIANTS.auxiliary },
    style: ({ theme }) => ({
      ...theme.typography.labelSmall,
      backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].default.background,
      color: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].default.color,
      borderRadius: '0.375rem',
      padding: '0.375rem 0rem',
      '& .MuiButton-startIcon': {
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].default.colorIcon,
      },
      '&:hover': {
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].hover.color,
        '& .MuiButton-startIcon': {
          color: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].hover.colorIcon,
        },
      },
      '&:focus-visible': {
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].hover.color,
        '& .MuiButton-startIcon': {
          color: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].hover.colorIcon,
        },
      },
      '&:active': {
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].active.color,
        '& .MuiButton-startIcon': {
          color: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].active.colorIcon,
        },
      },
      '&:disabled': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].disabled.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].disabled.color,
        '& .MuiButton-startIcon': {
          color: eliteaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].disabled.colorIcon,
        },
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.alarm },
    style: ({ theme }) => ({
      ...baseVariantStyle(theme),
      backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.alarm].default.background,
      color: eliteaButtonColors(theme)[BUTTON_VARIANTS.alarm].default.color,
      borderRadius: '1rem',
      gap: 0,
      '& .MuiButton-startIcon': {
        color: theme.palette.components.button.icon.default,
      },

      '&:hover': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.alarm].hover.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.alarm].hover.color,
      },
      '&:focus-visible': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.alarm].hover.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.alarm].hover.color,
      },
      '&:active': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.alarm].active.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.alarm].active.color,
      },
      '&:disabled': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.alarm].disabled.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.alarm].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.elitea },
    style: ({ theme, color }) => ({
      ...baseVariantStyle(theme),
      padding: '0.375rem 1rem',
      borderRadius: '1.75rem',

      ...(color === BUTTON_COLORS.primary && {
        height: '1.75rem',
        color: theme.palette.components.button.text.primary,
        background: theme.palette.components.button.background.primary.default,

        '&:hover': {
          background: theme.palette.components.button.background.primary.hover,
          boxShadow: 'none',
        },
        '&:focus-visible': {
          background: theme.palette.components.button.background.primary.hover,
          boxShadow: 'none',
        },
        '&:active': {
          background: theme.palette.components.button.background.primary.pressed,
        },
        '&:disabled': {
          color: theme.palette.components.button.text.primary,
          background: theme.palette.components.button.background.primary.disabled,
        },
      }),

      ...(color === BUTTON_COLORS.secondary && {
        color: theme.palette.text.secondary,
        background: theme.palette.components.button.background.secondary.default,
        '&:hover': {
          background: theme.palette.components.button.background.secondary.hover,
        },
        '&:focus-visible': {
          background: theme.palette.components.button.background.secondary.hover,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.components.button.background.secondary.pressed,
          border: `0.0625rem solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.components.button.text.disabled,
          background: theme.palette.components.button.background.default,
        },
      }),

      ...(color === BUTTON_COLORS.tertiary && {
        color: theme.palette.text.primary,
        background: 'transparent',
        minWidth: '1.75rem !important',
        height: '1.75rem',
        borderRadius: '1rem',
        padding: '0.375rem 0.75rem',
        gap: '0.625rem',

        '&:hover': {
          background: theme.palette.components.button.background.tertiary.hover,
          color: theme.palette.text.secondary,
        },
        '&:focus-visible': {
          background: theme.palette.components.button.background.tertiary.hover,
          color: theme.palette.text.secondary,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.components.button.background.tertiary.pressed,
        },

        '&:disabled': {
          color: theme.palette.components.button.text.disabled,
          background: 'transparent',
        },
      }),

      ...(color === BUTTON_COLORS.alarm && {
        color: theme.palette.text.alwaysWhite,
        background: theme.palette.components.button.background.alarm.default,
        height: '1.75rem',
        borderRadius: '1rem',
        gap: '0.625rem',
        '&:hover': {
          background: theme.palette.components.button.background.alarm.hover,
        },
        '&:focus-visible': {
          background: theme.palette.components.button.background.alarm.hover,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.components.button.background.alarm.pressed,
          border: `0.0625rem solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.components.button.text.primary,
          background: theme.palette.components.button.background.alarm.disabled,
        },
      }),
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.text },
    style: ({ theme }) => ({
      ...baseVariantStyle(theme),
      backgroundColor: 'transparent',
      color: theme.palette.text.primary,
      borderRadius: '1rem',
      minWidth: '1.75rem !important',
      padding: '0.375rem',
      gap: '0.625rem',
      '&:hover': {
        backgroundColor: theme.palette.components.button.background.secondary.default,
      },
      '&:focus-visible': {
        backgroundColor: theme.palette.components.button.background.secondary.default,
      },
      '&:active': {
        backgroundColor: theme.palette.components.button.background.secondary.pressed,
        color: theme.palette.text.primary,
        border: `0.0625rem solid ${theme.palette.border.lines}`,
      },
      '&:disabled': {
        backgroundColor: 'transparent',
        color: theme.palette.components.button.text.disabled,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.icon },
    style: ({ theme }) => ({
      borderRadius: '50%',
      padding: '0',
      minWidth: 'auto',
      width: '1.75rem',
      height: '1.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.palette.components.button.background.secondary.default,
      color: theme.palette.text.primary,

      '& .MuiButton-startIcon': {
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        '& > svg': {
          width: '1rem',
          height: '1rem',
          display: 'block',
        },
      },

      '&:hover': {
        backgroundColor: theme.palette.components.button.background.secondary.hover,
      },
      '&:focus-visible': {
        backgroundColor: theme.palette.components.button.background.secondary.hover,
      },
      '&:active': {
        backgroundColor: theme.palette.components.button.background.secondary.pressed,
      },
      '&:disabled': {
        backgroundColor: theme.palette.components.button.background.default,
        color: theme.palette.components.button.text.disabled,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.maxi },
    style: ({ theme }) => ({
      borderRadius: '50%',
      padding: '0',
      minWidth: 'auto',
      width: '3.5rem',
      height: '3.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: theme.palette.components.button.background.maxi.default,
      color: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.text.primary,

      '& .MuiButton-startIcon': {
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        '& > svg': {
          width: '1.5rem',
          height: '1.5rem',
          display: 'block',
        },
      },

      '&:hover': {
        backgroundColor: theme.palette.components.button.background.maxi.hover,
      },
      '&:focus-visible': {
        backgroundColor: theme.palette.components.button.background.maxi.hover,
      },
      '&:active': {
        backgroundColor: theme.palette.components.button.background.maxi.pressed,
      },
      '&:disabled': {
        backgroundColor: theme.palette.components.button.background.default,
        color: theme.palette.components.button.text.disabled,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.neutral },
    style: ({ theme }) => ({
      ...baseVariantStyle(theme),
      backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.neutral].default.background,
      color: eliteaButtonColors(theme)[BUTTON_VARIANTS.neutral].default.color,
      borderRadius: '1rem',
      gap: 0,
      '& .MuiButton-startIcon': {
        color: theme.palette.components.button.icon.default,
      },

      '&:hover': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.neutral].hover.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.neutral].hover.color,
      },
      '&:focus-visible': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.neutral].hover.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.neutral].hover.color,
      },
      '&:active': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.neutral].active.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.neutral].active.color,
      },
      '&:disabled': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.neutral].disabled.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.neutral].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.positive },
    style: ({ theme }) => ({
      ...baseVariantStyle(theme),
      backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.positive].default.background,
      color: eliteaButtonColors(theme)[BUTTON_VARIANTS.positive].default.color,
      borderRadius: '1rem',
      gap: 0,
      '& .MuiButton-startIcon': {
        color: theme.palette.components.button.icon.default,
      },

      '&:hover': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.positive].hover.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.positive].hover.color,
      },
      '&:focus-visible': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.positive].hover.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.positive].hover.color,
      },
      '&:active': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.positive].active.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.positive].active.color,
      },
      '&:disabled': {
        backgroundColor: eliteaButtonColors(theme)[BUTTON_VARIANTS.positive].disabled.background,
        color: eliteaButtonColors(theme)[BUTTON_VARIANTS.positive].disabled.color,
      },
    }),
  },
];

export const MuiButtonStyles = {
  defaultProps: {
    disableRipple: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      position: 'relative',
      '&::before': {
        display: 'none',
      },
      textTransform: 'none',
      fontFamily: '"Montserrat", Roboto, Arial, sans-serif',
      fontWeight: 500,
      borderRadius: '1.75rem',
      gap: '0.5rem',
      border: 'none',

      // Single supported size
      fontSize: '0.75rem',
      lineHeight: '1rem',
      padding: '0.375rem 1rem',
      minWidth: '3rem',

      '& .MuiButton-startIcon': {
        width: '1rem',
        height: '1rem',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& > svg': {
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
        },
      },

      '& .MuiButton-endIcon': {
        '& > svg': {
          display: 'block',
          maxWidth: '1rem',
          maxHeight: '1rem',
        },
      },

      '& .MuiCircularProgress-root': {
        color: theme.palette.primary.main,
        width: '1rem !important',
        height: '1rem !important',
      },
    }),
  },
  variants: eliteaButtonVariants,
};
