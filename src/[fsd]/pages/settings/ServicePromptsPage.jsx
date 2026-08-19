import { memo } from 'react';

import { DrawerPage, ServicePromptsSection } from '@/[fsd]/features/settings';

const ServicePromptsPage = memo(() => {
  return (
    <DrawerPage>
      <ServicePromptsSection />
    </DrawerPage>
  );
});

ServicePromptsPage.displayName = 'ServicePromptsPage';

export default ServicePromptsPage;
