import * as React from 'react';

import PropTypes from 'prop-types';

import { Box, Tab, Tabs } from '@mui/material';

import { AccessibilityAriaHelpers } from '@/[fsd]/shared/lib/helpers';
import { useTheme } from '@emotion/react';

import { CustomTabPanel, StyledTabBar } from './StyledTabs';

const StyledInternalTabs = styled(Tabs)(({ theme }) => ({
  [theme.breakpoints.up('lg')]: {
    width: 'auto',
  },
  marginRight: '2rem',
  minHeight: '2rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  '& button': {
    minHeight: '1.875rem',
    textTransform: 'capitalize',
  },
  '& button>svg': {
    fontSize: '1rem',
  },
}));

export default function StyledSimpleTabs({
  tabs = [],
  containerStyle = {},
  tabSX,
  panelStyle = {},
  defaultTab,
}) {
  const theme = useTheme();
  const [value, setValue] = React.useState(defaultTab || 0);

  const handleChange = React.useCallback((_, newValue) => {
    setValue(newValue);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        ...containerStyle,
      }}
    >
      <StyledTabBar
        sx={{
          boxSizing: 'border-box',
          padding: '0 1.5rem',
          paddingBottom: '12px',
          borderBottom: `1px solid ${theme.palette.border.table}`,
          ...tabSX,
        }}
      >
        <Box sx={{ display: 'flex' }}>
          <StyledInternalTabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
            sx={{ marginRight: '0px' }}
          >
            {tabs.map((tab, index) => (
              <Tab
                sx={{ padding: '0.25rem 1.25rem', flex: '0 0 auto', display: tab.display }}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                key={index}
                {...AccessibilityAriaHelpers.getTabAccessibilityProps(index)}
                disableRipple
              />
            ))}
          </StyledInternalTabs>
        </Box>
      </StyledTabBar>
      {tabs.map((tab, index) => (
        <CustomTabPanel
          style={{ display: tab.display, padding: '0 1.5rem', flex: 1, ...panelStyle }}
          value={value}
          index={index}
          key={index}
        >
          {tab.content}
        </CustomTabPanel>
      ))}
    </Box>
  );
}

StyledSimpleTabs.propTypes = {
  tabs: PropTypes.array,
};
