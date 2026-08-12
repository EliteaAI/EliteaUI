import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { useAvailableInternalTools } from '@/[fsd]/features/toolkits/lib/hooks';
import { useFormikAutoSaveOnBlur } from '@/[fsd]/shared/lib/hooks';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import EnableToggleCard from '../project-context/EnableToggleCard';

const TOOL_FIELD_MAP = {
  internal_mcp: 'default_internal_mcp_enabled',
  ask_user: 'default_ask_user_enabled',
  image_generation: 'default_image_generation_enabled',
  data_analysis: 'default_data_analysis_enabled',
  planner: 'default_planner_enabled',
  pyodide: 'default_pyodide_enabled',
  swarm: 'default_swarm_enabled',
  lazy_tools_mode: 'default_lazy_tools_mode_enabled',
};

const DefaultModulesSettings = memo(() => {
  const { checkPermission } = useCheckPermission();
  const canViewProjectContext = checkPermission(PERMISSIONS.projectContext.view);
  const canEditProjectContext = checkPermission(PERMISSIONS.projectContext.edit);

  const { values, setFieldValue } = useFormikContext();
  const { onBlur, requestSubmit } = useFormikAutoSaveOnBlur();

  const availableTools = useAvailableInternalTools({ includeAgentOnly: false });

  const handleToggle = useCallback(
    (fieldName, checkedValue) => {
      if (!canEditProjectContext) return;
      setFieldValue(fieldName, checkedValue);
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
      {availableTools.map(tool => {
        const fieldName = TOOL_FIELD_MAP[tool.name];
        if (!fieldName) return null;
        return (
          <EnableToggleCard
            key={tool.name}
            enabled={values[fieldName]}
            onToggle={(event, checkedValue) => handleToggle(fieldName, checkedValue)}
            disabled={!canEditProjectContext}
            title={tool.title}
            description={tool.infoTooltip?.text}
          />
        );
      })}
    </Box>
  );
});

DefaultModulesSettings.displayName = 'DefaultModulesSettings';
export default DefaultModulesSettings;

/** @type {MuiSx} */
const componentStyles = () => ({
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
