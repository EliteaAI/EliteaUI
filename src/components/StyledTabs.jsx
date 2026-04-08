import {
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';

import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { AccessibilityAriaHelpers } from '@/[fsd]/shared/lib/helpers';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import useGetComponentHeight from '@/hooks/useGetComponentHeight';
import useShouldCollapseRightToolbar from '@/hooks/useShouldCollapseRightToolbar';
import RouteDefinitions from '@/routes';
import styled from '@emotion/styled';

import AlertDialog from './AlertDialog';
import BackButton from './BackButton';

const StyledTabs = memo(
  forwardRef((props, ref) => {
    const {
      tabs = [],
      containerStyle = {},
      tabSX,
      panelStyle = {},
      defaultTab,
      hideBackButton = false,
      forceShowLabel = false,
      leftTabbarSectionSX,
      rightTabbarSectionSX,
      tabsSX,
      leftPart = null,
    } = props;
    return (
      <StyledTabsContextProvider>
        <StyledPureTabs
          ref={ref}
          tabs={tabs}
          containerStyle={containerStyle}
          tabSX={tabSX}
          panelStyle={panelStyle}
          defaultTab={defaultTab}
          leftButton={!hideBackButton && !leftPart ? <BackButton /> : leftPart}
          forceShowLabel={forceShowLabel}
          leftTabbarSectionSX={leftTabbarSectionSX}
          rightTabbarSectionSX={rightTabbarSectionSX}
          tabsSX={tabsSX}
        />
      </StyledTabsContextProvider>
    );
  }),
);

StyledTabs.displayName = 'StyledTabs';

StyledTabs.propTypes = {
  tabs: PropTypes.array,
};

export default StyledTabs;

export const StyledTabsContext = createContext();
export const StyledTabsContextProvider = memo(props => {
  const { children } = props;
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const [streamingType, setStreamingType] = useState();
  const setChatStreamingInfo = useCallback((isStreaming, type) => {
    setIsChatStreaming(isStreaming);
    setStreamingType(type);
  }, []);
  return (
    <StyledTabsContext.Provider
      value={{
        isChatStreaming,
        streamingType,
        setChatStreamingInfo,
      }}
    >
      {children}
    </StyledTabsContext.Provider>
  );
});

StyledTabsContextProvider.displayName = 'StyledTabsContextProvider';

const StyledPureTabs = memo(
  forwardRef((props, ref) => {
    const {
      tabs = [],
      containerStyle = {},
      tabSX,
      panelStyle = {},
      defaultTab,
      leftButton,
      forceShowLabel = false,
      leftTabbarSectionSX,
      rightTabbarSectionSX,
      tabsSX,
    } = props;

    const [value, setValue] = useState(defaultTab || 0);
    const tabBarItems = useMemo(() => tabs[value].tabBarItems, [tabs, value]);
    const rightToolbar = useMemo(() => tabs[value].rightToolbar, [tabs, value]);
    const { isChatStreaming, streamingType, setChatStreamingInfo } = useContext(StyledTabsContext) || {};
    const [openWarningDlg, setOpenWarningDlg] = useState(false);
    const [theDestIndex, setTheDestIndex] = useState(0);
    const { shouldCollapseTabs } = useShouldCollapseRightToolbar();
    const { componentRef, componentHeight } = useGetComponentHeight();
    const location = useLocation();
    const isCredentialsPage = location.pathname.includes('/credentials');
    const shouldShowLabel = forceShowLabel || (isCredentialsPage ? true : !shouldCollapseTabs);
    const isCreatePage =
      location.pathname.includes(RouteDefinitions.CreatePipeline) ||
      location.pathname.includes(RouteDefinitions.CreateApplication);
    const styles = styledPureTabsStyles(componentHeight, shouldShowLabel, tabSX, isCreatePage);

    const warningMessage = useMemo(() => {
      switch (streamingType) {
        case 'datasource':
          return 'The datasource is being executed. Are you sure you want to leave?';
        case 'application':
          return 'The agent is being executed. Are you sure you want to leave?';
        default:
          return 'Output is still generating. Switching now will stop it and you may lose progress. Switch anyway?';
      }
    }, [streamingType]);

    const handleChange = useCallback(
      (_, newValue) => {
        if (isChatStreaming) {
          setTheDestIndex(newValue);
          setOpenWarningDlg(true);
        } else {
          setValue(newValue);
        }
      },
      [isChatStreaming],
    );

    useImperativeHandle(
      ref,
      () => ({
        switchToTab: tabIndex => {
          handleChange(null, tabIndex);
        },
        getCurrentTab: () => value,
      }),
      [handleChange, value],
    );

    const onConfirm = useCallback(() => {
      setValue(theDestIndex);
      setOpenWarningDlg(false);
      setChatStreamingInfo(false, streamingType);
    }, [setChatStreamingInfo, streamingType, theDestIndex]);

    const onCancel = useCallback(() => {
      setOpenWarningDlg(false);
    }, []);

    return (
      <>
        <Box sx={[styles.root, containerStyle]}>
          <Box
            ref={componentRef}
            sx={[styles.tabBarRoot, styles.tabBar]}
          >
            <Box sx={[styles.leftSection, leftTabbarSectionSX]}>
              {leftButton}
              <BaseTabs
                sx={[styles.tabsRoot, styles.tabs, tabsSX]}
                value={value}
                onChange={handleChange}
                aria-label="basic tabs example"
              >
                {tabs.map((tab, index) => {
                  const showLabel = isCreatePage || shouldShowLabel;

                  const tabProps = {
                    label: showLabel ? tab.label : '',
                    icon: tab.icon,
                    iconPosition: 'start',
                    ...AccessibilityAriaHelpers.getTabAccessibilityProps(index),
                  };

                  return tab.disabled ? (
                    <Tooltip
                      title={tab.disabled || 'This tab is disabled'}
                      placement="top"
                      key={index}
                    >
                      <Box component="span">
                        <BaseTab
                          {...tabProps}
                          sx={[styles.disabledTab, { display: tab.display }]}
                          disabled
                        />
                      </Box>
                    </Tooltip>
                  ) : (
                    <BaseTab
                      sx={[styles.tab, { display: tab.display }]}
                      key={index}
                      {...tabProps}
                    />
                  );
                })}
              </BaseTabs>
            </Box>

            <Box sx={[styles.tabBarItemsContainer, rightTabbarSectionSX]}>
              {tabBarItems}
              <Box sx={styles.rightToolbarContainer}>{rightToolbar}</Box>
            </Box>
          </Box>
          {tabs.map((tab, index) => (
            <CustomTabPanel
              sx={[styles.tabPanel, { display: tab.display }, panelStyle, tab.style]}
              value={value}
              index={index}
              key={index}
            >
              {tab.content}
            </CustomTabPanel>
          ))}
        </Box>
        <AlertDialog
          title="Warning"
          alertContent={warningMessage}
          open={openWarningDlg}
          alarm
          onClose={onCancel}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      </>
    );
  }),
);

StyledPureTabs.displayName = 'StyledPureTabs';

export const CustomTabPanel = memo(props => {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index ? children : null}
    </Box>
  );
});

CustomTabPanel.displayName = 'CustomTabPanel';

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

export const StyledTabBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  borderBottomStyle: 'solid !important',
  borderBottomWidth: '0.0625rem',
  borderBottomColor: theme.palette.border.sidebarDivider,
  width: '100%',
  background: theme.palette.background.eliteaDefault,
}));

/** @type {MuiSx} */
const styledPureTabsStyles = (componentHeight, shouldShowLabel, tabSX, isCreatePage) => ({
  tabsRoot: ({ breakpoints }) => ({
    [breakpoints.up('lg')]: {
      width: 'auto',
    },
    marginRight: '2rem',
    minHeight: '2rem',
    fontSize: '0.875rem',
    '& button': {
      minHeight: '1.875rem',
      textTransform: 'capitalize',
    },
    '& button>svg': {
      fontSize: '1rem',
    },
  }),
  root: {
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  tabBarRoot: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    borderBottomStyle: 'solid !important',
    borderBottomWidth: '0.0625rem',
    borderBottomColor: palette.border.sidebarDivider,
    width: '100%',
    background: palette.background.eliteaDefault,
  }),
  tabBar: ({ palette }) => ({
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    flexDirection: 'row !important',
    alignItems: 'center',
    minHeight: '3.75rem',
    boxSizing: 'border-box',
    padding: componentHeight < 65 ? '0 1.5rem' : '1.25rem 1.5rem',
    justifyContent: 'space-between',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    ...tabSX,
  }),
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  tabs: {
    marginRight: '0px',
    ...(isCreatePage && {
      '& .MuiTabs-indicator': {
        display: 'none',
      },
    }),
  },
  tab: ({ palette }) => ({
    fontWeight: '600',
    ...(isCreatePage && {
      pointerEvents: 'none',
      '&.MuiTab-textColorPrimary': {
        color: palette.text.secondary,
      },
      '&.Mui-selected': {
        color: palette.text.secondary,
      },
    }),
  }),
  disabledTab: {
    opacity: 0.3,
    padding: '0.25rem 1.25rem',
  },
  tabBarItemsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    flex: 1,
  },
  rightToolbarContainer: {
    display: 'flex',
    flexDirection: 'row-reverse',
    flex: 0,
  },
  tabPanel: ({ palette }) => ({
    padding: '0 1.5rem',
    flex: 1,
    height: 'calc(100% - 3.75rem)',
    boxSizing: 'border-box',
    overflowY: 'scroll',
    backgroundColor: palette.background.tabPanel,
  }),
});
