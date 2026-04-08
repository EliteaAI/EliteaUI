import { useMemo } from 'react';

import StickyTabs from '@/components/StickyTabs';
import ViewToggle from '@/components/ViewToggle';
import { CredentialsList } from '@/pages/Credentials/CredentialsList';

export const Credentials = () => {
  const tabs = useMemo(
    () => [
      {
        content: <CredentialsList />,
      },
    ],
    [],
  );

  return (
    <StickyTabs
      tabs={tabs}
      value={0}
      showTitleAndSwitchBySelect
      title="Credentials"
      containerStyle={{ padding: '0 1.5rem 0 0' }}
      tabBarStyle={{ padding: '0 0.5rem 0 1.5rem' }}
      middleTabComponent={<ViewToggle />}
    />
  );
};
