import { forwardRef, memo } from 'react';

import { Tabs as MuiTabs } from '@mui/material';

export const TABS_VARIANTS = {
  alita: 'alita',
};

const BaseTabs = memo(
  forwardRef((props, ref) => {
    const { children, variant = TABS_VARIANTS.alita, ...restProps } = props;

    return (
      <MuiTabs
        ref={ref}
        variant={variant}
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

export const alitaTabsVariants = [
  {
    props: { variant: TABS_VARIANTS.alita },
    style: ({ theme }) => ({
      ...baseTabsStyle(theme),
    }),
  },
];
