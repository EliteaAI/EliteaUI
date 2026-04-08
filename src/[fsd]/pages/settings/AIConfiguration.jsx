import { memo, useCallback, useMemo, useState } from 'react';

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
    <StickyTabs
      tabs={tabs}
      value={selectedTab}
      onChangeTab={onTabChange}
      title={tabs[selectedTab]?.label || 'Settings'}
      tabBarStyle={styles.tabBar}
      tabPanelStyle={styles.tabPanel}
      containerStyle={styles.tabContainer}
    />
  );
});

AIConfiguration.displayName = 'AIConfiguration';

/** @type {MuiSx} */
const getStyles = () => ({
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
