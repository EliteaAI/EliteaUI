import { memo } from 'react';

import { AIProvidersContent, DrawerPage } from '@/[fsd]/features/settings';

const AIProviders = memo(() => {
  return (
    <DrawerPage>
      <AIProvidersContent />
    </DrawerPage>
  );
});

AIProviders.displayName = 'AIProviders';

export default AIProviders;
