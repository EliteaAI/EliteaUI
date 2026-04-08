import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import PropTypes from 'prop-types';

import { Badge, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import { AccessibilityAriaHelpers } from '@/[fsd]/shared/lib/helpers';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import { RIGHT_PANEL_WIDTH } from '@/common/constants';
import { filterProps } from '@/common/utils';

import BackButton from './BackButton';

function CustomTabPanel(props) {
  const { children, value, index, id, ...other } = props;

  return value === index ? (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={id || `simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {children}
    </div>
  ) : null;
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const ResponsiveBox = styled(
  Box,
  filterProps('fullWidth'),
)(() => ({
  width: '100%',
  boxSizing: 'border-box',
  height: '100%',
  padding: '0 1.5rem 0rem 1.5rem',
  display: 'flex',
  justifyContent: 'center',
}));

const ContentBox = styled(Box)(() => ({
  width: '100%',
  height: '100%',
}));

const FixedTabBar = styled(
  Grid,
  filterProps('noRightPanel'),
)(({ noRightPanel }) => ({
  borderBottom: 1,
  borderColor: 'divider',
  width: `calc(100% - ${noRightPanel ? 0 : RIGHT_PANEL_WIDTH + 16}px)`,
  marginRight: '0',
  zIndex: 999,
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  height: '60px',
}));

const TabsContainer = styled(Grid)(() => ({
  flexWrap: 'nowrap',
  width: '100%',
  overflowX: 'scroll',
}));

const MiddleArea = styled(
  Grid,
  filterProps('noRightPanel'),
)(() => ({
  flexGrow: 1,
  display: 'flex',
  boxSizing: 'border-box',
  justifyContent: 'flex-end',
  alignItems: 'center',
  height: '35.5px',
  gap: '20px',
  flexShrink: 0,
}));

const CountBadge = styled(Badge)(() => ({
  height: '8px',
  width: '16px',
}));

const StickyTabs = memo(props => {
  const {
    tabs = [],
    value = 0,
    middleTabComponent,
    onChangeTab,
    tabBarStyle = {},
    containerStyle,
    noRightPanel,
    tabPanelStyle,
    middleAreaSX,
    extraHeader,
    isLoading,
    showTitleAndSwitchBySelect = false,
    title,
    showBackButton,
  } = props;

  const tabBarRef = useRef();
  const tabsRef = useRef();
  const [tabsMinWidth, setTabsMinWidth] = useState(undefined);
  const [tabBarHeight, setTabBarHeight] = useState(51);
  const handleChange = useCallback(
    (_, newValue) => {
      onChangeTab(newValue);
    },
    [onChangeTab],
  );

  const updateTabBarHeight = useCallback(() => {
    if (tabBarRef.current?.offsetHeight) {
      setTabBarHeight(tabBarRef.current.offsetHeight);
    }
  }, []);

  useLayoutEffect(() => {
    updateTabBarHeight();
  }, [updateTabBarHeight]);

  useEffect(() => {
    updateTabBarHeight();
  }, [isLoading, updateTabBarHeight]);

  useEffect(() => {
    let resizeObserver = null;
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setTabsMinWidth(entry.target.offsetWidth);
        }
      });
      resizeObserver.observe(tabsRef.current);
    }
    return () => {
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <ResponsiveBox sx={containerStyle}>
      <ContentBox>
        <FixedTabBar
          noRightPanel={noRightPanel}
          ref={tabBarRef}
          sx={tabBarStyle}
          container
        >
          {extraHeader}
          <TabsContainer container>
            <Box
              display="flex"
              flexDirection="row"
              alignItems="center"
              ref={tabsRef}
              minWidth={tabsMinWidth}
              gap="12px"
            >
              {!showTitleAndSwitchBySelect ? (
                <>
                  {showBackButton && <BackButton />}
                  <BaseTabs
                    value={value}
                    onChange={handleChange}
                  >
                    {tabs.map((tab, index) => (
                      <BaseTab
                        sx={{ display: tab.display }}
                        label={
                          <Box component="div">
                            <Typography
                              component="span"
                              variant="labelMedium"
                            >
                              {tab.label}
                            </Typography>
                            {tab.count > 0 && (
                              <CountBadge
                                component="div"
                                badgeContent={tab.count}
                                color="info"
                              />
                            )}
                          </Box>
                        }
                        icon={tab.icon}
                        key={index}
                        {...AccessibilityAriaHelpers.getTabAccessibilityProps(index)}
                      />
                    ))}
                  </BaseTabs>
                </>
              ) : (
                <Box
                  height="100%"
                  display="flex"
                  alignItems="center"
                >
                  <Typography
                    component="div"
                    variant="labelMedium"
                    color="text.secondary"
                  >
                    {title}
                  </Typography>
                </Box>
              )}
            </Box>
            {middleTabComponent && (
              <MiddleArea
                noRightPanel={noRightPanel}
                sx={middleAreaSX}
              >
                {middleTabComponent}
              </MiddleArea>
            )}
          </TabsContainer>
        </FixedTabBar>
        {/* <Box height={tabBarHeight + 'px'}/> */}
        {tabs.map((tab, index) => (
          <CustomTabPanel
            id="EliteACustomTabPanel"
            style={{
              display: tab.display,
              overflowY: 'scroll',
              height: `calc(100% - ${tabBarHeight}px)`,
              ...tabPanelStyle,
              width: '100%',
            }}
            value={value}
            index={index}
            key={index}
          >
            {tab.content}
          </CustomTabPanel>
        ))}
      </ContentBox>
    </ResponsiveBox>
  );
});

StickyTabs.displayName = 'StickyTabs';

export default StickyTabs;

StickyTabs.propTypes = {
  tabs: PropTypes.array,
};
