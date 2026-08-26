import { memo, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import { useProjectContextQuery } from '@/api/projectContext';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

import ProjectContextEmptyState from './ProjectContextEmptyState';
import ProjectContextSavedView from './ProjectContextSavedView';

const ProjectContextContent = memo(() => {
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const navigate = useNavigate();

  const canViewProjectContext = checkPermission(PERMISSIONS.projectContext.view);
  const canEditProjectContext = checkPermission(PERMISSIONS.projectContext.edit);

  const { data: serverData, isLoading } = useProjectContextQuery(projectId, {
    skip: !projectId || !canViewProjectContext,
  });

  const handleNavigate = useCallback(
    (newState, options = {}) => {
      if (newState === 'create' || newState === 'edit') {
        const state = {};
        if (options.openAi) state.openAi = true;
        if (options.openAiEdit) state.openAiEdit = true;
        navigate(RouteDefinitions.ProjectContextEdit, {
          state: Object.keys(state).length ? state : undefined,
        });
      } else {
        navigate(RouteDefinitions.ProjectContext);
      }
    },
    [navigate],
  );

  const styles = getStyles();

  if (isLoading) {
    return (
      <Box
        data-testid="project-context-loader"
        sx={styles.loader}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!canViewProjectContext) return null;

  const hasContent = Boolean(serverData?.content?.trim());

  if (hasContent) {
    return (
      <Box sx={styles.root}>
        <ProjectContextSavedView
          serverData={serverData}
          projectId={projectId}
          canEdit={canEditProjectContext}
          onNavigate={handleNavigate}
        />
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      <ProjectContextEmptyState
        canEdit={canEditProjectContext}
        onNavigate={handleNavigate}
      />
    </Box>
  );
});

ProjectContextContent.displayName = 'ProjectContextContent';
export default ProjectContextContent;

/** @type {MuiSx} */
const getStyles = () => ({
  loader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
});
