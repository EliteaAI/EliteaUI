import { forwardRef, memo } from 'react';

import { Tabs as MuiTabs } from '@mui/material';

export const TABS_VARIANTS = {
  elitea: 'elitea',
};

const BaseTabs = memo(
  forwardRef((props, ref) => {
    const { children, ...restProps } = props;

    return (
      <MuiTabs
        ref={ref}
        {...restProps}
      >
        {children}
      </MuiTabs>
    );
  }),
);

BaseTabs.displayName = 'BaseTabs';

export default BaseTabs;

const baseTabsStyle = theme => ({
  minHeight: '2rem !important',
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.background.tabs.default,
    borderRadius: '2rem 2rem 0 0',
  },
});

export const eliteaTabsVariants = [
  {
    props: { variant: TABS_VARIANTS.elitea },
    style: ({ theme }) => ({
      ...baseTabsStyle(theme),
    }),
  },
];

export const MuiTabsStyles = {
  styleOverrides: {
    root: ({ theme }) => ({
      ...baseTabsStyle(theme),
    }),
  },
};
