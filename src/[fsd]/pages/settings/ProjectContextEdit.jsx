import { memo, useCallback, useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { DrawerPage } from '@/[fsd]/features/settings';
import ProjectContextEditor from '@/[fsd]/features/settings/ui/project-context/ProjectContextEditor';
import { useProjectContextQuery } from '@/api/projectContext';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

const ProjectContextEdit = memo(() => {
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();

  const canEditProjectContext = checkPermission(PERMISSIONS.projectContext.edit);

  useEffect(() => {
    if (!canEditProjectContext) {
      navigate(RouteDefinitions.ProjectContext, { replace: true });
    }
  }, [canEditProjectContext, navigate]);

  const { data: serverData } = useProjectContextQuery(projectId, {
    skip: !projectId || !checkPermission(PERMISSIONS.projectContext.view),
  });

  const hasContent = Boolean(serverData?.content?.trim());

  const handleNavigate = useCallback(
    navigateTo => {
      if (navigateTo === 'create' || navigateTo === 'edit') {
        navigate(RouteDefinitions.ProjectContextEdit);
      } else {
        navigate(RouteDefinitions.ProjectContext);
      }
    },
    [navigate],
  );

  if (!canEditProjectContext) return null;

  return (
    <DrawerPage>
      <ProjectContextEditor
        serverData={serverData}
        projectId={projectId}
        isCreate={!hasContent}
        canEdit={canEditProjectContext}
        openAiModal={locationState?.openAi === true}
        openAiEditModal={locationState?.openAiEdit === true}
        onNavigate={handleNavigate}
      />
    </DrawerPage>
  );
});

ProjectContextEdit.displayName = 'ProjectContextEdit';
export default ProjectContextEdit;
