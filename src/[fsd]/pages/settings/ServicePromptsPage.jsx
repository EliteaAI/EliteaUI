import { memo } from 'react';

import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { ServicePromptsSection } from '@/[fsd]/features/settings/ui/system-prompts';

const ServicePromptsPage = memo(() => {
  return (
    <DrawerPage>
      <ServicePromptsSection />
    </DrawerPage>
  );
});

ServicePromptsPage.displayName = 'ServicePromptsPage';

export default ServicePromptsPage;
