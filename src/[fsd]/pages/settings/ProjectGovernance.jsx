import { memo } from 'react';

import { ProjectGovernanceContent } from '@/[fsd]/features/project-governance';
import { DrawerPage } from '@/[fsd]/features/settings';

const ProjectGovernance = memo(() => {
  return (
    <DrawerPage>
      <ProjectGovernanceContent />
    </DrawerPage>
  );
});

ProjectGovernance.displayName = 'ProjectGovernance';

export default ProjectGovernance;
