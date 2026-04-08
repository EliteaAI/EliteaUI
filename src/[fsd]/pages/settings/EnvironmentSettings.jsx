import { memo } from 'react';

import { DrawerPage, DrawerPageHeader } from '@/[fsd]/features/settings/ui/drawer-page';
import { EnvironmentSection } from '@/[fsd]/features/settings/ui/environment';

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
