import { memo } from 'react';

import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { ProjectGeneralContent } from '@/[fsd]/features/settings/ui/project-general';

const ProjectGeneralPage = memo(() => (
  <DrawerPage>
    <ProjectGeneralContent />
  </DrawerPage>
));

ProjectGeneralPage.displayName = 'ProjectGeneralPage';
export default ProjectGeneralPage;
