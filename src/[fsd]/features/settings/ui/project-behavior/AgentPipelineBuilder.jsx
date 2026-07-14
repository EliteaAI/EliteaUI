/* eslint-disable no-unused-vars */
import { memo, useCallback, useState } from 'react';

import { Box, CircularProgress } from '@mui/material';

import { useProjectContextQuery } from '@/api/projectContext';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import EnableToggleCard from './EnableToggleCard';

const AgentPipelineBuilder = memo(() => {
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const canViewProjectContext = checkPermission(PERMISSIONS.projectContext.view);
  const canEditProjectContext = checkPermission(PERMISSIONS.projectContext.edit);

  const { data: serverData, isLoading } = useProjectContextQuery(projectId, {
    skip: !projectId || !canViewProjectContext,
  });

  const [enabled, setEnabled] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  const handleToggle = useCallback(
    e => {
      if (!canEditProjectContext) return;
      setEnabled(e.target.checked);
      setIsDirty(true);
    },
    [canEditProjectContext],
  );

  const styles = componentStyles();

  if (isLoading) {
    return (
      <Box sx={styles.loader}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!canViewProjectContext) {
    return null;
  }

  return (
    <Box sx={styles.body}>
      <EnableToggleCard
        enabled={enabled}
        onToggle={handleToggle}
        disabled={!canEditProjectContext}
        title="Agent & Pipeline Builder"
        description="Create and update agents and pipelines directly from chat."
      />
    </Box>
  );
});

AgentPipelineBuilder.displayName = 'AgentPipelineBuilder';
export default AgentPipelineBuilder;

/** @type {MuiSx} */
const componentStyles = () => ({
  loader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  body: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    padding: '0rem 0rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
  },
});
