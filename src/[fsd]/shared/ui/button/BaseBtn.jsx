import { forwardRef, memo } from 'react';

import { Button as MuiButton } from '@mui/material';
import { buttonClasses } from '@mui/material/Button';

export const BUTTON_COLORS = {
  primary: buttonClasses.colorPrimary,
  secondary: buttonClasses.colorSecondary,
  tertiary: 'tertiary',
  alarm: 'alarm',
};

export const BUTTON_VARIANTS = {
  alita: 'alita',
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
    const { children, ...restProps } = props;

    return (
      <MuiButton
        ref={ref}
        {...restProps}
      >
        {children}
      </MuiButton>
    );
  }),
);

BaseBtn.displayName = 'BaseBtn';

export default BaseBtn;

export const alitaButtonColors = theme => ({
  [BUTTON_VARIANTS.special]: {
    default: {
      background: theme.palette.mode === 'dark' ? 'rgba(106, 232, 250, 0.2)' : 'rgba(245, 81, 249, 0.2)',
      color: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.text.secondary,
    },
    hover: {
      background: theme.palette.mode === 'dark' ? 'rgba(106, 232, 250, 0.3)' : 'rgba(245, 81, 249, 0.3)',
    },
    active: {
      background: theme.palette.mode === 'dark' ? 'rgba(106, 232, 250, 0.1)' : 'rgba(245, 81, 249, 0.1)',
      color: theme.palette.mode === 'dark' ? theme.palette.primary.pressed : theme.palette.text.secondary,
    },
    disabled: {
      background: theme.palette.background.button.default,
      color: theme.palette.text.default,
    },
  },
  [BUTTON_VARIANTS.contained]: {
    default: {
      background: theme.palette.background.button.primary.default,
      color: theme.palette.text.button.primary,
    },
    hover: { background: theme.palette.background.button.primary.hover },
    active: { background: theme.palette.background.button.primary.pressed },
    disabled: {
      background: theme.palette.background.button.primary.disabled,
      color: theme.palette.text.button.primary,
    },
  },
  [BUTTON_VARIANTS.secondary]: {
    default: {
      background: theme.palette.background.button.secondary.default,
      color: theme.palette.text.secondary,
      border: '0.0625rem solid transparent',
    },
    hover: { background: theme.palette.background.button.secondary.hover },
    active: {
      background: theme.palette.background.button.secondary.pressed,
      color: theme.palette.mode === 'dark' ? theme.palette.text.default : theme.palette.text.secondary,
      border: `0.0625rem solid ${theme.palette.border.lines}`,
    },
    disabled: {},
  },
  [BUTTON_VARIANTS.iconCounter]: {
    default: {
      background: theme.palette.background.button.secondary.default,
      color: theme.palette.text.secondary,
    },
    hover: {
      background: theme.palette.background.button.secondary.hover,
    },
    active: {
      background:
        theme.palette.mode === 'dark'
          ? theme.palette.background.button.secondary.default
          : theme.palette.background.button.secondary.pressed,
    },
    disabled: {
      background: theme.palette.background.button.default,
      color: theme.palette.text.button.disabled,
    },
  },
  [BUTTON_VARIANTS.iconLabel]: {
    default: {
      background: theme.palette.background.button.iconLabelButton.default,
      color: theme.palette.text.secondary,
    },
    hover: {
      background: theme.palette.background.button.iconLabelButton.hover,
    },
    active: { background: theme.palette.background.button.iconLabelButton.selected },
    disabled: {
      background: theme.palette.background.button.default,
      color: theme.palette.text.button.disabled,
    },
  },
  [BUTTON_VARIANTS.tertiary]: {
    default: { background: 'transparent', color: theme.palette.text.default },
    hover: {
      background: theme.palette.background.button.tertiary.hover,
      color: theme.palette.text.secondary,
    },
    active: {
      color: theme.palette.text.primary,
      background: theme.palette.background.button.tertiary.pressed,
    },
    disabled: { color: theme.palette.text.button.disabled, background: 'transparent' },
  },
  [BUTTON_VARIANTS.auxiliary]: {
    default: {
      background: theme.palette.background.default,
      color: theme.palette.mode === 'dark' ? theme.palette.primary.pressed : theme.palette.primary.main,
      colorIcon: theme.palette.secondary.main,
    },
    hover: {
      color:
        theme.palette.mode === 'dark' ? theme.palette.primary.hover : theme.palette.text.button.auxiliary,
      colorIcon: theme.palette.text.secondary,
    },
    active: {
      color:
        theme.palette.mode === 'dark' ? theme.palette.text.button.disabled : theme.palette.secondary.main,
      colorIcon: theme.palette.secondary.main,
    },
    disabled: {
      background: theme.palette.background.default,
      color: theme.palette.text.button.disabled,
      colorIcon: theme.palette.text.button.disabled,
    },
  },
  [BUTTON_VARIANTS.alarm]: {
    default: { background: theme.palette.background.button.alarm.default, color: 'white' },
    hover: { background: theme.palette.background.button.alarm.hover, color: 'white' },
    active: { background: theme.palette.background.button.alarm.pressed, color: 'white' },
    disabled: {
      background: theme.palette.background.button.alarm.disabled,
      color: 'white',
    },
  },
  [BUTTON_VARIANTS.neutral]: {
    default: { background: theme.palette.background.button.neutral.default, color: 'white' },
    hover: { background: theme.palette.background.button.neutral.hover, color: 'white' },
    active: { background: theme.palette.background.button.neutral.pressed, color: 'white' },
    disabled: {
      background: theme.palette.background.button.neutral.disabled,
      color: 'white',
    },
  },
  [BUTTON_VARIANTS.positive]: {
    default: { background: theme.palette.background.button.positive.default, color: 'white' },
    hover: { background: theme.palette.background.button.positive.hover, color: 'white' },
    active: { background: theme.palette.background.button.positive.pressed, color: 'white' },
    disabled: {
      background: theme.palette.background.button.positive.disabled,
      color: 'white',
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
    gap: '0.5rem',
    '& .MuiButton-startIcon': {
      margin: 0,
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

    ...(options.iconOnly && isIconOnly
      ? {
          minWidth: 'auto',
          width: '1.75rem',
          borderRadius: '50%',
          padding: 0,
          '& .MuiButton-loadingIndicator': {
            position: 'static',
            margin: 0,
            transform: 'none',
          },
        }
      : {}),
  };
};

export const alitaButtonVariants = [
  {
    props: { variant: BUTTON_VARIANTS.special },
    style: ({ theme, ownerState }) => ({
      ...baseVariantStyle(theme, ownerState, { iconOnly: true }),
      ...(ownerState.children != null && ownerState.startIcon != null && { paddingLeft: '0.75rem' }),
      backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.special].default.background,
      color: alitaButtonColors(theme)[BUTTON_VARIANTS.special].default.color,

      '&:hover': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.special].hover.background,
      },
      '&:focus-visible': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.special].hover.background,
      },

      '&:active': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.special].active.background,
      },

      '&:disabled': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.special].disabled.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.special].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.contained },
    style: ({ theme, ownerState }) => ({
      ...baseVariantStyle(theme, ownerState, { iconOnly: true }),
      backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.contained].default.background,
      color: alitaButtonColors(theme)[BUTTON_VARIANTS.contained].default.color,
      '&:hover': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.contained].hover.background,
      },
      '&:focus-visible': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.contained].hover.background,
      },
      '&:active': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.contained].active.background,
      },
      '&:disabled': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.contained].disabled.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.contained].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.secondary },
    style: ({ theme, ownerState }) => ({
      ...baseVariantStyle(theme, ownerState, { iconOnly: true }),

      backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.secondary].default.background,
      color: alitaButtonColors(theme)[BUTTON_VARIANTS.secondary].default.color,
      border: alitaButtonColors(theme)[BUTTON_VARIANTS.secondary].default.border,
      '&:hover': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.secondary].hover.background,
      },
      '&:focus-visible': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.secondary].hover.background,
      },
      '&:active': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.secondary].active.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.secondary].active.color,
        border: alitaButtonColors(theme)[BUTTON_VARIANTS.secondary].active.border,
      },
      '&:disabled': {
        backgroundColor: theme.palette.background.button.default,
        color: theme.palette.text.button.disabled,
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

      backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].default.background,
      color: alitaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].default.color,

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
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].hover.background,
      },
      '&:focus-visible': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].hover.background,
      },
      '&:active': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].active.background,
      },
      '&:disabled': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].disabled.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.iconCounter].disabled.color,
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
      backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].default.background,
      color: alitaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].default.color,
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem',
      '& .MuiButton-startIcon > svg': {
        width: '0.75rem',
        height: '0.75rem',
      },
      '&:hover': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].hover.background,
      },
      '&:focus-visible': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].hover.background,
      },
      '&:active': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].active.background,
      },
      '&:disabled': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].default.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.iconLabel].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.tertiary },
    style: ({ theme, ownerState }) => {
      const isIconOnly = getIsIconOnly(ownerState);

      return {
        ...baseVariantStyle(theme, ownerState, { iconOnly: true }),
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.tertiary].default.color,
        background: alitaButtonColors(theme)[BUTTON_VARIANTS.tertiary].default.background,
        minWidth: '1.75rem !important',
        borderRadius: '1rem',
        gap: '0.625rem',
        ...(isIconOnly ? { width: '1.75rem', padding: 0 } : { padding: '0.375rem 1rem' }),

        '&:hover': {
          background: alitaButtonColors(theme)[BUTTON_VARIANTS.tertiary].hover.background,
          color: alitaButtonColors(theme)[BUTTON_VARIANTS.tertiary].hover.color,
        },

        '&:focus-visible': {
          background: alitaButtonColors(theme)[BUTTON_VARIANTS.tertiary].hover.background,
          color: alitaButtonColors(theme)[BUTTON_VARIANTS.tertiary].hover.color,
        },

        '&:active': {
          color: alitaButtonColors(theme)[BUTTON_VARIANTS.tertiary].active.color,
          background: alitaButtonColors(theme)[BUTTON_VARIANTS.tertiary].active.background,
        },

        '&:disabled': {
          color: alitaButtonColors(theme)[BUTTON_VARIANTS.tertiary].disabled.color,
          background: alitaButtonColors(theme)[BUTTON_VARIANTS.tertiary].disabled.background,
        },
      };
    },
  },

  {
    props: { variant: BUTTON_VARIANTS.auxiliary },
    style: ({ theme }) => ({
      ...theme.typography.labelSmall,
      backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].default.background,
      color: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].default.color,
      borderRadius: '0.375rem',
      padding: '0.375rem 0rem',
      '& .MuiButton-startIcon': {
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].default.colorIcon,
      },
      '&:hover': {
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].hover.color,
        '& .MuiButton-startIcon': {
          color: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].hover.colorIcon,
        },
      },
      '&:focus-visible': {
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].hover.color,
        '& .MuiButton-startIcon': {
          color: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].hover.colorIcon,
        },
      },
      '&:active': {
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].active.color,
        '& .MuiButton-startIcon': {
          color: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].active.colorIcon,
        },
      },
      '&:disabled': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].disabled.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].disabled.color,
        '& .MuiButton-startIcon': {
          color: alitaButtonColors(theme)[BUTTON_VARIANTS.auxiliary].disabled.colorIcon,
        },
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.alarm },
    style: ({ theme }) => ({
      ...baseVariantStyle(theme),
      backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.alarm].default.background,
      color: alitaButtonColors(theme)[BUTTON_VARIANTS.alarm].default.color,
      borderRadius: '1rem',
      gap: 0,
      '& .MuiButton-startIcon': {
        color: theme.palette.icon.fill.button,
      },

      '&:hover': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.alarm].hover.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.alarm].hover.color,
      },
      '&:focus-visible': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.alarm].hover.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.alarm].hover.color,
      },
      '&:active': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.alarm].active.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.alarm].active.color,
      },
      '&:disabled': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.alarm].disabled.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.alarm].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.alita },
    style: ({ theme, color }) => ({
      ...baseVariantStyle(theme),
      padding: '0.375rem 1rem',
      borderRadius: '1.75rem',

      ['&.' + BUTTON_COLORS.primary]: {
        height: '1.75rem',
        color: theme.palette.text.button.primary,
        background: theme.palette.background.button.primary.default,

        '&:hover': {
          background: theme.palette.background.button.primary.hover,
        },
        '&:focus-visible': {
          background: theme.palette.background.button.primary.hover,
        },
        '&:active': {
          background: theme.palette.background.button.primary.pressed,
        },
        '&:disabled': {
          color: theme.palette.text.button.primary,
          background: theme.palette.background.button.primary.disabled,
        },
      },

      ['&.' + BUTTON_COLORS.secondary]: {
        color: theme.palette.text.secondary,
        background: theme.palette.background.button.secondary.default,
        '&:hover': {
          background: theme.palette.background.button.secondary.hover,
        },
        '&:focus-visible': {
          background: theme.palette.background.button.secondary.hover,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.background.button.secondary.pressed,
          border: `0.0625rem solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.text.button.disabled,
          background: theme.palette.background.button.default,
        },
      },

      ...(color === BUTTON_COLORS.tertiary && {
        color: theme.palette.text.default,
        background: 'transparent',
        minWidth: '1.75rem !important',
        height: '1.75rem',
        borderRadius: '1rem',
        padding: '0.375rem 0.75rem',
        gap: '0.625rem',

        '&:hover': {
          background: theme.palette.background.button.tertiary.hover,
          color: theme.palette.text.secondary,
        },
        '&:focus-visible': {
          background: theme.palette.background.button.tertiary.hover,
          color: theme.palette.text.secondary,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.background.button.tertiary.pressed,
        },

        '&:disabled': {
          color: theme.palette.text.button.disabled,
          background: 'transparent',
        },
      }),

      ...(color === BUTTON_COLORS.alarm && {
        color: 'white',
        background: theme.palette.background.button.alarm.default,
        height: '1.75rem',
        borderRadius: '1rem',
        gap: '0.625rem',
        '&:hover': {
          background: theme.palette.background.button.alarm.hover,
        },
        '&:focus-visible': {
          background: theme.palette.background.button.alarm.hover,
        },
        '&:active': {
          color: theme.palette.text.primary,
          background: theme.palette.background.button.alarm.pressed,
          border: `0.0625rem solid ${theme.palette.border.lines}`,
        },
        '&:disabled': {
          color: theme.palette.text.button.primary,
          background: theme.palette.background.button.alarm.disabled,
        },
      }),
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.text },
    style: ({ theme }) => ({
      ...baseVariantStyle(theme),
      backgroundColor: 'transparent',
      color: theme.palette.text.default,
      borderRadius: '1rem',
      minWidth: '1.75rem !important',
      padding: '0.375rem',
      gap: '0.625rem',
      '&:hover': {
        backgroundColor: theme.palette.background.button.secondary.default,
      },
      '&:focus-visible': {
        backgroundColor: theme.palette.background.button.secondary.default,
      },
      '&:active': {
        backgroundColor: theme.palette.background.button.secondary.pressed,
        color: theme.palette.text.primary,
        border: `0.0625rem solid ${theme.palette.border.lines}`,
      },
      '&:disabled': {
        backgroundColor: 'transparent',
        color: theme.palette.text.button.disabled,
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
      backgroundColor: theme.palette.background.button.secondary.default,
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
        backgroundColor: theme.palette.background.button.secondary.hover,
      },
      '&:focus-visible': {
        backgroundColor: theme.palette.background.button.secondary.hover,
      },
      '&:active': {
        backgroundColor: theme.palette.background.button.secondary.pressed,
      },
      '&:disabled': {
        backgroundColor: theme.palette.background.button.default,
        color: theme.palette.text.button.disabled,
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

      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(41, 184, 245, 0.2)' : 'rgba(196, 40, 221, 0.2)',
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
        backgroundColor:
          theme.palette.mode === 'dark' ? 'rgba(41, 184, 245, 0.3)' : 'rgba(196, 40, 221, 0.3)',
      },
      '&:focus-visible': {
        backgroundColor:
          theme.palette.mode === 'dark' ? 'rgba(41, 184, 245, 0.3)' : 'rgba(196, 40, 221, 0.3)',
      },
      '&:active': {
        backgroundColor:
          theme.palette.mode === 'dark' ? 'rgba(41, 184, 245, 0.1)' : 'rgba(196, 40, 221, 0.1)',
      },
      '&:disabled': {
        backgroundColor: theme.palette.background.button.default,
        color: theme.palette.text.button.disabled,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.neutral },
    style: ({ theme }) => ({
      ...baseVariantStyle(theme),
      backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.neutral].default.background,
      color: alitaButtonColors(theme)[BUTTON_VARIANTS.neutral].default.color,
      borderRadius: '1rem',
      gap: 0,
      '& .MuiButton-startIcon': {
        color: theme.palette.icon.fill.button,
      },

      '&:hover': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.neutral].hover.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.neutral].hover.color,
      },
      '&:focus-visible': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.neutral].hover.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.neutral].hover.color,
      },
      '&:active': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.neutral].active.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.neutral].active.color,
      },
      '&:disabled': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.neutral].disabled.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.neutral].disabled.color,
      },
    }),
  },
  {
    props: { variant: BUTTON_VARIANTS.positive },
    style: ({ theme }) => ({
      ...baseVariantStyle(theme),
      backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.positive].default.background,
      color: alitaButtonColors(theme)[BUTTON_VARIANTS.positive].default.color,
      borderRadius: '1rem',
      gap: 0,
      '& .MuiButton-startIcon': {
        color: theme.palette.icon.fill.button,
      },

      '&:hover': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.positive].hover.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.positive].hover.color,
      },
      '&:focus-visible': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.positive].hover.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.positive].hover.color,
      },
      '&:active': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.positive].active.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.positive].active.color,
      },
      '&:disabled': {
        backgroundColor: alitaButtonColors(theme)[BUTTON_VARIANTS.positive].disabled.background,
        color: alitaButtonColors(theme)[BUTTON_VARIANTS.positive].disabled.color,
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
  variants: alitaButtonVariants,
};
