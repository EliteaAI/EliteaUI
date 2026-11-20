import { memo, useMemo, useRef } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { Modules, Switch } from '@/[fsd]/features/agent/ui/agent-details/configurations';
import {
  ToolkitsHelpers,
  useAvailableInternalTools,
  useGetCurrentToolkitSchemas,
} from '@/[fsd]/features/toolkits';
import { AccordionConstants, TourTargetConstants } from '@/[fsd]/shared/lib/constants';
import { isMcpToolkit } from '@/[fsd]/shared/lib/helpers';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { markAllDuplicatesByMultipleKeys } from '@/common/utils';
import ToolCard from '@/pages/Applications/Components/Tools/ToolCard';
import ToolMenu from '@/pages/Applications/Components/Tools/ToolMenu';

const ApplicationTools = memo(props => {
  const {
    style,
    containerSX,
    applicationId,
    disabled,
    title = 'Tools',
    hidePythonSandbox = false,
    entityProjectId,
    isPipeline = false,
  } = props;
  const sortedToolsRef = useRef(null);

  const { values } = useFormikContext();
  const versionStatus = values?.version_details?.status;
  const isVersionLocked = versionStatus === 'published' || versionStatus === 'embedded';
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const isMcpVisible = useIsMcpVisible();
  const currentInternalTools = useMemo(
    () => values?.version_details?.meta?.internal_tools || [],
    [values?.version_details?.meta?.internal_tools],
  );

  const availableInternalTools = useAvailableInternalTools({
    includeAgentOnly: true,
    activeToolNames: currentInternalTools,
  });

  const tools = useMemo(() => values?.version_details?.tools || [], [values?.version_details?.tools]);

  // Sort tools only on first load: enabled tools first, then disabled
  const sortedInternalTools = useMemo(() => {
    if (sortedToolsRef.current && sortedToolsRef.current.length === availableInternalTools.length)
      return sortedToolsRef.current;

    const sorted = [...availableInternalTools].sort((a, b) => {
      const aEnabled = currentInternalTools.includes(a.name);
      const bEnabled = currentInternalTools.includes(b.name);

      if (aEnabled === bEnabled) return 0;

      return bEnabled - aEnabled;
    });

    sortedToolsRef.current = sorted;

    return sorted;
  }, [availableInternalTools, currentInternalTools]);

  // For pipeline pages show only the attachments card; agent pages use the Modules dropdown.
  const pipelineVisibleTools = useMemo(
    () => (isPipeline ? sortedInternalTools.filter(t => t.name === 'attachments') : []),
    [isPipeline, sortedInternalTools],
  );

  const shouldShowModulesMenu = !isPipeline && !hidePythonSandbox && sortedInternalTools.length > 0;

  const modulesMenu = shouldShowModulesMenu && (
    <Modules.AgentModulesMenu
      modules={sortedInternalTools}
      readOnly={disabled}
    />
  );

  const markedDuplicateTools = useMemo(
    () =>
      markAllDuplicatesByMultipleKeys(
        tools
          .map((tool, originalIndex) => ({
            tool,
            originalIndex, // Keep track of the original index in the tools array
            type: tool.type,
            label: ToolkitsHelpers.genToolkitName(tool, toolkitSchemas || {}),
          }))
          .filter(({ tool }) => isMcpVisible || !isMcpToolkit(tool)),
        ['type', 'label'],
      ),
    [toolkitSchemas, tools, isMcpVisible],
  );

  return (
    <BasicAccordion
      data-testid="agent-toolkits-section"
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordionStyles}
      items={[
        {
          title,
          content: (
            <Box sx={[styles.containerStyles, containerSX]}>
              {!disabled ? (
                <Box
                  sx={styles.actionsRow}
                  data-tour={TourTargetConstants.AGENT_TOUR_TARGET_IDS.tools}
                >
                  <ToolMenu applicationId={applicationId}>{modulesMenu}</ToolMenu>
                </Box>
              ) : (
                modulesMenu && <Box sx={styles.actionsRow}>{modulesMenu}</Box>
              )}

              {markedDuplicateTools.map((markedDuplicateTool, index) => (
                <ToolCard
                  key={index}
                  tool={markedDuplicateTool.tool}
                  index={markedDuplicateTool.originalIndex} // Use the original index from tools array
                  applicationId={applicationId}
                  disabled={disabled || isVersionLocked}
                  isDuplicate={markedDuplicateTool.isDuplicate}
                  entityProjectId={entityProjectId}
                  isPipeline={isPipeline}
                />
              ))}

              {pipelineVisibleTools.length > 0 && (
                <Box sx={styles.internalToolsContainer}>
                  <Typography sx={styles.internalToolsTitle}>MODULES</Typography>
                  <Box sx={styles.internalToolsGrid}>
                    {pipelineVisibleTools.map(tool => (
                      <Switch.AgentInternalToolSwitch
                        key={tool.name}
                        title={tool.title}
                        name={tool.name}
                        icon={tool.icon}
                        disabled={disabled}
                        unavailable={tool.unavailable}
                        infoTooltip={tool.unavailable ? { text: tool.unavailableTooltip } : tool.infoTooltip}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ),
        },
      ]}
    />
  );
});

ApplicationTools.displayName = 'ApplicationTools';

const styles = {
  accordionStyles: {
    background: theme => `${theme.palette.background.default.tertiary} !important`,
  },
  containerStyles: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  actionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    margin: '0.75rem 0',
  },
  internalToolsTitle: {
    margin: '0.5rem 0 1rem',
    fontWeight: 500,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
  },
  internalToolsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  internalToolsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(max(18rem, calc(50% - 0.25rem)), 1fr))',
    gap: '0.5rem',
    width: '100%',
  },
};

export default ApplicationTools;
