import { memo } from 'react';

import AIProvidersContent from '@/[fsd]/features/settings/ui/ai-providers/AIProvidersContent';
import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';

const AIProviders = memo(() => {
  return (
    <DrawerPage>
      <AIProvidersContent />
    </DrawerPage>
  );
});

AIProviders.displayName = 'AIProviders';

export default AIProviders;
