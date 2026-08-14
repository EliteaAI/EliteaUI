import { memo } from 'react';

import { DrawerPage, DrawerPageHeader, EnvironmentSection } from '@/[fsd]/features/settings';

const EnvironmentSettings = memo(() => {
  return (
    <DrawerPage>
      <DrawerPageHeader
        title="Environment"
        showBorder
      />
      <EnvironmentSection />
    </DrawerPage>
  );
});

EnvironmentSettings.displayName = 'EnvironmentSettings';

export default EnvironmentSettings;
