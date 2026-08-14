import { memo } from 'react';

import { DrawerPage, ProjectGeneralContent } from '@/[fsd]/features/settings';

const ProjectGeneralPage = memo(() => (
  <DrawerPage>
    <ProjectGeneralContent />
  </DrawerPage>
));

ProjectGeneralPage.displayName = 'ProjectGeneralPage';
export default ProjectGeneralPage;
