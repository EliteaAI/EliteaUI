import { memo } from 'react';

import { DrawerPage, ProjectContextContent } from '@/[fsd]/features/settings';

const ProjectContext = memo(() => (
  <DrawerPage>
    <ProjectContextContent />
  </DrawerPage>
));

ProjectContext.displayName = 'ProjectContext';
export default ProjectContext;
