import { memo } from 'react';

import { DrawerPage } from '@/[fsd]/features/settings/ui/drawer-page';
import { ProjectBehaviorContent } from '@/[fsd]/features/settings/ui/project-behavior';

const ProjectBehavior = memo(() => (
  <DrawerPage>
    <ProjectBehaviorContent />
  </DrawerPage>
));

ProjectBehavior.displayName = 'ProjectBehavior';
export default ProjectBehavior;
