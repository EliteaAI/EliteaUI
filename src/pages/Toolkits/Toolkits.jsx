import { useMemo } from 'react';

import ToolkitsList from '@/[fsd]/features/toolkits/ui/list/ToolkitsList';
import { ContentType } from '@/common/constants';
import StickyTabs from '@/components/StickyTabs';
import ViewToggle from '@/components/ViewToggle';

export const Toolkits = ({ isMCP }) => {
  const tabs = useMemo(
    () => [
      {
        content: (
          <ToolkitsList
            isMCP={isMCP}
            cardContentType={isMCP ? ContentType.MCPAll : ContentType.ToolkitAll}
          />
        ),
      },
    ],
    [isMCP],
  );
  return (
    <StickyTabs
      tabs={tabs}
      value={0}
      showTitleAndSwitchBySelect
      title={!isMCP ? 'Toolkits' : 'MCPs'}
      containerStyle={{ padding: '0 1.5rem 0 0' }}
      tabBarStyle={{ padding: '0 0.5rem 0 1.5rem' }}
      middleTabComponent={<ViewToggle />}
    />
  );
};
