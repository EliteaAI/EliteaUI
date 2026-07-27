import { memo, useCallback, useEffect, useRef } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import { useProjectContextQuery } from '@/api/projectContext';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import ProjectContextEditor from './ProjectContextEditor';
import ProjectContextEmptyState from './ProjectContextEmptyState';
import ProjectContextSavedView from './ProjectContextSavedView';

const ProjectContextContent = memo(() => {
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const [searchParams, setSearchParams] = useSearchParams();

  const canViewProjectContext = checkPermission(PERMISSIONS.projectContext.view);
  const canEditProjectContext = checkPermission(PERMISSIONS.projectContext.edit);

  const { data: serverData, isLoading } = useProjectContextQuery(projectId, {
    skip: !projectId || !canViewProjectContext,
  });

  const view = searchParams.get('view'); // 'create' | 'edit' | null
  const openAiModal = searchParams.get('openAi') === 'true';

  // Reset URL params when switching projects
  const prevProjectIdRef = useRef(projectId);
  useEffect(() => {
    if (prevProjectIdRef.current !== projectId) {
      prevProjectIdRef.current = projectId;
      setSearchParams({}, { replace: true });
    }
  }, [projectId, setSearchParams]);

  const handleNavigate = useCallback(
    (newState, options = {}) => {
      if (newState === 'create' || newState === 'edit') {
        const params = { view: newState };
        if (options.openAi) params.openAi = 'true';
        setSearchParams(params);
      } else {
        setSearchParams({}, { replace: true });
      }
    },
    [setSearchParams],
  );

  const styles = getStyles();

  if (isLoading) {
    return (
      <Box sx={styles.loader}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!canViewProjectContext) return null;

  const hasContent = Boolean(serverData?.content?.trim());

  if (view === 'create' || view === 'edit') {
    return (
      <Box sx={styles.root}>
        <ProjectContextEditor
          serverData={serverData}
          projectId={projectId}
          isCreate={view === 'create'}
          canEdit={canEditProjectContext}
          openAiModal={openAiModal}
          onNavigate={handleNavigate}
        />
      </Box>
    );
  }

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
