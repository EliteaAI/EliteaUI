import { memo } from 'react';

import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { ProjectContextContent } from '@/[fsd]/features/settings/ui/project-context';

const ProjectContextPage = memo(() => (
  <DrawerPage>
    <ProjectContextContent />
  </DrawerPage>
));

ProjectContextPage.displayName = 'ProjectContextPage';
export default ProjectContextPage;
