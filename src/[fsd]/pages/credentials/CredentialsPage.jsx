import { memo } from 'react';

import { SECTION_PAGE_KEYS, SectionPage } from '@/[fsd]/widgets/section-page';
import CredentialsList from '@/pages/Credentials/CredentialsList';

const PROJECT_CONTENT = <CredentialsList />;

const CredentialsPage = memo(() => (
  <SectionPage
    sectionKey={SECTION_PAGE_KEYS.credentials}
    projectContent={PROJECT_CONTENT}
  />
));

CredentialsPage.displayName = 'CredentialsPage';

export default CredentialsPage;
