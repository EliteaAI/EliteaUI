import { memo } from 'react';

import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { ProjectContextContent } from '@/[fsd]/features/settings/ui/project-context';

const ProjectContext = memo(() => (
  <DrawerPage>
    <ProjectContextContent />
  </DrawerPage>
));

ProjectContext.displayName = 'ProjectContext';
export default ProjectContext;
