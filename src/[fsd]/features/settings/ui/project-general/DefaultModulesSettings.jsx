import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { useAvailableInternalTools } from '@/[fsd]/features/toolkits/lib/hooks';
import { InternalToolsConstants } from '@/[fsd]/shared/lib/constants';
import { useFormikAutoSaveOnBlur } from '@/[fsd]/shared/lib/hooks';
import { Switch } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const MODULE_ORDER = [
  'image_generation',
  'data_analysis',
  'internal_mcp',
  'skill_builder',
  'project_context_builder',
  'ask_user',
  'planner',
  'pyodide',
  'swarm',
  'lazy_tools_mode',
];

const MODULE_TITLE_OVERRIDES = {
  image_generation: 'Image Creation',
  internal_mcp: 'Agent & Pipeline Builder',
  lazy_tools_mode: 'Smart Tools Selection',
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
  const toolsByName = useMemo(() => new Map(availableTools.map(tool => [tool.name, tool])), [availableTools]);
  const moduleRows = useMemo(
    () => MODULE_ORDER.map(name => toolsByName.get(name)).filter(Boolean),
    [toolsByName],
  );

  if (!canViewProjectContext) {
    return null;
  }

  return (
    <Box
      sx={styles.body}
      onBlur={onBlur}
    >
      <Box sx={styles.headerRow}>
        <Typography
          variant="bodySmall"
          sx={styles.headerCellLeft}
        >
          Module
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.headerCell}
        >
          Conversations
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.headerCell}
        >
          Agents
        </Typography>
      </Box>
      {moduleRows.map(tool => {
        const conversationField = InternalToolsConstants.INTERNAL_TOOL_PERSONALIZATION_FIELD_MAP[tool.name];
        const agentField = InternalToolsConstants.INTERNAL_TOOL_AGENT_PERSONALIZATION_FIELD_MAP[tool.name];
        if (!conversationField) return null;

        const description = tool.infoTooltip?.text || '';

        return (
          <Box
            key={tool.name}
            sx={styles.dataRow}
          >
            <Box sx={styles.moduleCell}>
              <Typography
                variant="headingSmall"
                color="text.secondary"
              >
                {MODULE_TITLE_OVERRIDES[tool.name] || tool.title}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={styles.moduleDescription}
              >
                {description}
              </Typography>
            </Box>
            <Box sx={styles.toggleCell}>
              <Switch.BaseSwitch
                checked={Boolean(values[conversationField])}
                onChange={(event, checkedValue) => handleToggle(conversationField, checkedValue)}
                color="primary"
                disabled={!canEditProjectContext}
              />
            </Box>
            <Box sx={styles.toggleCell}>
              {agentField ? (
                <Switch.BaseSwitch
                  checked={Boolean(values[agentField])}
                  onChange={(event, checkedValue) => handleToggle(agentField, checkedValue)}
                  color="primary"
                  disabled={!canEditProjectContext}
                />
              ) : (
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                >
                  —
                </Typography>
              )}
            </Box>
          </Box>
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
  headerRow: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 7.5rem 7.5rem',
    alignItems: 'center',
    gap: '1rem',
    padding: '0rem 1.5rem',
    color: palette.text.secondary,
  }),
  headerCellLeft: {
    fontWeight: 500,
  },
  headerCell: {
    textAlign: 'center',
    fontWeight: 500,
  },
  dataRow: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 7.5rem 7.5rem',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.userInputBackground,
  }),
  moduleCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  moduleDescription: ({ palette }) => ({
    color: palette.text.primary,
  }),
  toggleCell: {
    display: 'flex',
    justifyContent: 'center',
  },
});
