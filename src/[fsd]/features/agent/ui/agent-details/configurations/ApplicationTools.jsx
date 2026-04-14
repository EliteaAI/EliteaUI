import { memo, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { Switch } from '@/[fsd]/features/agent/ui/agent-details/configurations';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useAvailableInternalTools } from '@/[fsd]/shared/lib/hooks';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { markAllDuplicatesByMultipleKeys } from '@/common/utils';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import ToolCard from '@/pages/Applications/Components/Tools/ToolCard';
import ToolMenu from '@/pages/Applications/Components/Tools/ToolMenu';
import RouteDefinitions from '@/routes';

const ApplicationTools = memo(props => {
  const {
    style,
    containerSX,
    applicationId,
    disabled,
    title = 'Toolkits',
    hidePythonSandbox = false,
    entityProjectId,
  } = props;
  const sortedToolsRef = useRef(null);

  const isFromPipeline = useIsFrom(RouteDefinitions.Pipelines);

  const { values } = useFormikContext();
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  // Use POC approach: get available internal tools based on toolkit availability
  // Include agent-only tools since this is agent configuration
  const availableInternalTools = useAvailableInternalTools({ includeAgentOnly: true });

  const [showAllInternalTools, setShowAllInternalTools] = useState(false);

  const currentInternalTools = useMemo(
    () => values?.version_details?.meta?.internal_tools || [],
    [values?.version_details?.meta?.internal_tools],
  );

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

  const { displayedInternalTools, canToggleTools } = useMemo(() => {
    const totalTools = sortedInternalTools.length;
    const selectedCount = currentInternalTools.length;

    // Minimum tools to show: at least 4, or all selected tools if more than 4 are selected
    const minToolsToShow = Math.max(4, selectedCount);
    const canToggle = totalTools > minToolsToShow;

    if (showAllInternalTools || !canToggle) {
      return {
        displayedInternalTools: sortedInternalTools,
        canToggleTools: canToggle,
      };
    }

    return {
      displayedInternalTools: sortedInternalTools.slice(0, minToolsToShow),
      canToggleTools: canToggle,
    };
  }, [sortedInternalTools, showAllInternalTools, currentInternalTools.length]);

  const markedDuplicateTools = useMemo(
    () =>
      markAllDuplicatesByMultipleKeys(
        tools.map((tool, originalIndex) => ({
          tool,
          originalIndex, // Keep track of the original index in the tools array
          type: tool.type,
          label: ToolkitsHelpers.genToolkitName(tool, toolkitSchemas || {}),
        })),
        ['type', 'label'],
      ),
    [toolkitSchemas, tools],
  );

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordionStyles}
      items={[
        {
          title,
          content: (
            <Box sx={[styles.containerStyles, containerSX]}>
              {!disabled && (
                <Box sx={{ margin: '.75rem 0' }}>
                  <ToolMenu applicationId={applicationId} />
                </Box>
              )}

              {markedDuplicateTools.map((markedDuplicateTool, index) => (
                <ToolCard
                  key={index}
                  tool={markedDuplicateTool.tool}
                  index={markedDuplicateTool.originalIndex} // Use the original index from tools array
                  applicationId={applicationId}
                  disabled={disabled}
                  isDuplicate={markedDuplicateTool.isDuplicate}
                  entityProjectId={entityProjectId}
                />
              ))}

              {!isFromPipeline && !hidePythonSandbox && sortedInternalTools.length > 0 && (
                <Box sx={styles.internalToolsContainer}>
                  <Typography sx={styles.internalToolsTitle}>INTERNAL TOOLS</Typography>
                  <Box sx={styles.internalToolsGrid}>
                    {displayedInternalTools.map(tool => (
                      <Switch.AgentInternalToolSwitch
                        key={tool.name}
                        title={tool.title}
                        name={tool.name}
                        icon={tool.icon}
                        disabled={disabled}
                        infoTooltip={tool.infoTooltip}
                      />
                    ))}
                  </Box>
                  {canToggleTools && (
                    <Box sx={styles.showMoreContainer}>
                      <Typography
                        onClick={() => setShowAllInternalTools(!showAllInternalTools)}
                        sx={styles.showMoreButton}
                      >
                        {showAllInternalTools ? 'Show less' : 'Show all'}
                      </Typography>
                    </Box>
                  )}
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
    background: theme => `${theme.palette.background.tabPanel} !important`,
  },
  containerStyles: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(max(15rem, calc(50% - 0.25rem)), 1fr))',
    gap: '0.5rem',
    width: '100%',
  },
  showMoreContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: '0.75rem',
  },
  showMoreButton: ({ palette }) => ({
    color: palette.primary.pressed,
    fontSize: '0.75rem',
    fontWeight: 400,
    padding: '0.375rem 0',

    '&:hover': {
      backgroundColor: 'transparent',
      opacity: 0.8,
      cursor: 'pointer',
    },
  }),
};

export default ApplicationTools;
