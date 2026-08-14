import { memo } from 'react';

import { DrawerPage, SecretsContent } from '@/[fsd]/features/settings';

const Secrets = memo(() => {
  return (
    <DrawerPage>
      <SecretsContent />
    </DrawerPage>
  );
});

Secrets.displayName = 'Secrets';

export default Secrets;
