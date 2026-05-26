import { memo, useCallback, useMemo, useState } from 'react';

import { Box } from '@mui/material';

import { AI_CONFIG_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants/aiConfigurationTourTargets.constants';
import ModelConfiguration from '@/[fsd]/features/settings/ui/ai-configuration/Configuration/ModelConfiguration';
import { OpenAITemplate } from '@/[fsd]/features/settings/ui/ai-configuration/OpenAITemplate';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import StickyTabs from '@/components/StickyTabs';

const AIConfiguration = memo(() => {
  const [selectedTab, setSelectedTab] = useState(0);
  const styles = getStyles();
  const tabs = useMemo(
    () => [
      {
        label: 'AI Configuration',
        content: (
          <DrawerPage>
            <ModelConfiguration />
          </DrawerPage>
        ),
      },
      {
        label: 'OpenAI Template',
        tabProps: { 'data-tour': AI_CONFIG_TOUR_TARGET_IDS.openaiTemplateTab },
        content: (
          <DrawerPage>
            <OpenAITemplate />
          </DrawerPage>
        ),
      },
    ],
    [],
  );
  const onTabChange = useCallback(newTab => {
    setSelectedTab(newTab);
  }, []);
  return (
    <Box
      data-tour={AI_CONFIG_TOUR_TARGET_IDS.page}
      sx={styles.pageWrapper}
    >
      <StickyTabs
        tabs={tabs}
        value={selectedTab}
        onChangeTab={onTabChange}
        title={tabs[selectedTab]?.label || 'Settings'}
        tabBarStyle={styles.tabBar}
        tabPanelStyle={styles.tabPanel}
        containerStyle={styles.tabContainer}
      />
    </Box>
  );
});

AIConfiguration.displayName = 'AIConfiguration';

/** @type {MuiSx} */
const getStyles = () => ({
  pageWrapper: {
    height: '100%',
  },
  tabBar: ({ palette }) => ({
    width: '100% !important',
    padding: '0rem 1rem 0rem 1rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    display: 'flex',
    alignItems: 'center',
    '& .MuiGrid-root': {
      paddingBottom: '0.25rem',
    },
  }),
  tabPanel: {
    display: 'flex',
  },
  tabContainer: {
    padding: 0,
  },
});

export default AIConfiguration;
