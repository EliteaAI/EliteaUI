import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { useFormikAutoSaveOnBlur } from '@/[fsd]/shared/lib/hooks';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import EnableToggleCard from '../project-context/EnableToggleCard';

const AgentPipelineBuilder = memo(() => {
  const { checkPermission } = useCheckPermission();
  const canViewProjectContext = checkPermission(PERMISSIONS.projectContext.view);
  const canEditProjectContext = checkPermission(PERMISSIONS.projectContext.edit);

  const { values, setFieldValue } = useFormikContext();
  const { onBlur, requestSubmit } = useFormikAutoSaveOnBlur();

  const handleToggle = useCallback(
    (event, checkedValue) => {
      if (!canEditProjectContext) return;
      setFieldValue('default_internal_mcp_enabled', checkedValue);
      requestSubmit();
    },
    [canEditProjectContext, setFieldValue, requestSubmit],
  );

  const styles = componentStyles();

  if (!canViewProjectContext) {
    return null;
  }

  return (
    <Box
      sx={styles.body}
      onBlur={onBlur}
    >
      <EnableToggleCard
        enabled={values.default_internal_mcp_enabled}
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
