import { memo } from 'react';

import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { SecretsContent } from '@/[fsd]/features/settings/ui/secrets';

const Secrets = memo(() => {
  return (
    <DrawerPage>
      <SecretsContent />
    </DrawerPage>
  );
});

Secrets.displayName = 'Secrets';

export default Secrets;
