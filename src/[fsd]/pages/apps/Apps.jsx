import { memo, useMemo } from 'react';

import ToolkitsList from '@/[fsd]/features/toolkits/ui/list/ToolkitsList';
import { ContentType } from '@/common/constants';
import StickyTabs from '@/components/StickyTabs';
import ViewToggle from '@/components/ViewToggle';

const Apps = memo(() => {
  const tabs = useMemo(
    () => [
      {
        content: (
          <ToolkitsList
            isApplication={true}
            cardContentType={ContentType.AppAll}
          />
        ),
      },
    ],
    [],
  );
  return (
    <StickyTabs
      tabs={tabs}
      value={0}
      showTitleAndSwitchBySelect
      title="Apps"
      containerStyle={{ padding: '0 1.5rem 0 0' }}
      tabBarStyle={{ padding: '0 0.5rem 0 1.5rem' }}
      middleTabComponent={<ViewToggle />}
    />
  );
});

Apps.displayName = 'Apps';

export default Apps;
