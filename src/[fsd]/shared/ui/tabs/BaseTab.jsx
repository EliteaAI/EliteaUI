import { forwardRef, memo } from 'react';

import { Tab as MuiTab } from '@mui/material';

import { TABS_VARIANTS } from './BaseTabs';

const BaseTab = memo(
  forwardRef((props, ref) => {
    const { variant = TABS_VARIANTS.alita, iconPosition = 'start', ...restProps } = props;

    return (
      <MuiTab
        ref={ref}
        variant={variant}
        iconPosition={iconPosition}
        {...restProps}
      />
    );
  }),
);

BaseTab.displayName = 'BaseTab';

export default BaseTab;

export const alitaTabColors = theme => ({
  [TABS_VARIANTS.alita]: {
    default: theme.palette.background.tab.default,
    hover: theme.palette.background.tab.hover,
    active: theme.palette.background.tab.active,
    disabled: theme.palette.background.tab.disabled,
  },
});

const baseTabStyle = () => ({
  padding: '0.5rem 1rem 0.5rem 1rem',
  borderRadius: '0.5rem 0.5rem 0 0',
  minHeight: '0rem',
  textTransform: 'none',
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
  overflow: 'visible',
  textOverflow: 'clip',
  maxWidth: 'none',
  '& .MuiSvgIcon-root': {
    color: 'inherit',
    fontSize: '1rem',
  },
});

export const alitaTabVariants = [
  {
    props: { variant: TABS_VARIANTS.alita },
    style: ({ theme, ownerState }) => {
      const colors = alitaTabColors(theme)[TABS_VARIANTS.alita];
      const isIconOnly = ownerState.label === '' || ownerState.label == null;
      return {
        ...baseTabStyle(),
        minWidth: isIconOnly ? '3.5rem' : 'auto',
        '&.MuiTab-textColorPrimary': {
          color: colors.default,
        },
        '&.Mui-selected': {
          color: colors.active,
        },
        '&:hover:not(.Mui-selected):not(.Mui-disabled)': {
          color: colors.hover,
        },
        '&.Mui-disabled': {
          color: colors.disabled,
        },
      };
    },
  },
];
