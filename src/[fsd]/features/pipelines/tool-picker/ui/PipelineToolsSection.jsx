import { memo, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import AgentInternalToolSwitch from '@/[fsd]/features/agent/ui/agent-details/configurations/switch/AgentInternalToolSwitch';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks/useGetToolkitNameFromSchema.hooks';
import { PICKER_KINDS } from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';
import {
  collectToolReferences,
  groupAttachmentsByKind,
} from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/pipelineToolUsage.helpers';
import { useIsVersionLocked } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/useIsVersionLocked.hooks';
import { usePipelineAttachments } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/usePipelineAttachments.hooks';
import { useAvailableInternalTools } from '@/[fsd]/features/toolkits/lib/hooks/useAvailableInternalTools.hooks';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { selectActivePipeline } from '@/slices/pipeline';

import PipelineToolCard from './PipelineToolCard';

// Cross-slice imports point at files, not barrels: the agent, toolkits and flow-editor barrels reach
// ApplicationTools or the node components, which import this slice back (import cycle).

const ATTACHMENTS_TOOL_NAME = 'attachments';

/**
 * Read-only list (toolkits, MCPs, agents, then pipelines) of what the pipeline nodes use. Toolkits, MCPs, agents and pipelines are picked in the
 * nodes; "Used by" opens a node's panel.
 */
const PipelineToolsSection = memo(props => {
  const { style, disabled = false, onSelectNode } = props;

  const { values } = useFormikContext();
  const { detach } = usePipelineAttachments();
  const isVersionLocked = useIsVersionLocked();
  // Only attachments no node uses (left by the old "+ Toolkit / + Agent" buttons) can be removed here
  const canRemoveUnused = !disabled && !isVersionLocked;
  const { yamlJsonObject } = useSelector(selectActivePipeline);
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();
  const isMcpVisible = useIsMcpVisible();

  const internalTools = useMemo(
    () => values?.version_details?.meta?.internal_tools || [],
    [values?.version_details?.meta?.internal_tools],
  );
  const availableInternalTools = useAvailableInternalTools({
    includeAgentOnly: true,
    activeToolNames: internalTools,
  });
  const moduleTools = useMemo(
    () => availableInternalTools.filter(tool => tool.name === ATTACHMENTS_TOOL_NAME),
    [availableInternalTools],
  );

  const attachmentToolkitId = values?.version_details?.meta?.attachment_toolkit_id;
  const groups = useMemo(
    () =>
      groupAttachmentsByKind({
        tools: values?.version_details?.tools || [],
        refs: collectToolReferences(yamlJsonObject),
        getToolkitName: getToolkitNameFromSchema,
        hiddenKinds: isMcpVisible ? [] : [PICKER_KINDS.mcp],
        // The Attachments module below stands for its own toolkit
        hiddenToolIds: attachmentToolkitId ? [attachmentToolkitId] : [],
      }),
    [
      attachmentToolkitId,
      getToolkitNameFromSchema,
      isMcpVisible,
      values?.version_details?.tools,
      yamlJsonObject,
    ],
  );

  const styles = pipelineToolsSectionStyles();

  return (
    <BasicAccordion
      data-testid="pipeline-tools-section"
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordion}
      items={[
        {
          title: 'Tools',
          content: (
            <Box sx={styles.content}>
              {groups.length === 0 && (
                <Typography
                  variant="bodySmall"
                  color="text.primary"
                  data-testid="pipeline-tools-section-empty"
                >
                  Tools you select in nodes will appear here.
                </Typography>
              )}
              {groups.length > 0 && (
                <Box
                  sx={styles.group}
                  data-testid="pipeline-tools-list"
                >
                  {groups.flatMap(group =>
                    group.items.map(item => (
                      <PipelineToolCard
                        key={item.key}
                        tool={item.tool}
                        kind={item.kind}
                        usedBy={item.usedBy}
                        onSelectNode={onSelectNode}
                        onRemove={canRemoveUnused && !item.usedBy.length ? detach : undefined}
                      />
                    )),
                  )}
                </Box>
              )}
              {moduleTools.length > 0 && (
                <Box sx={styles.group}>
                  <Typography
                    variant="labelSmall"
                    sx={styles.groupTitle}
                  >
                    Modules
                  </Typography>
                  {moduleTools.map(tool => (
                    <AgentInternalToolSwitch
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
              )}
            </Box>
          ),
        },
      ]}
    />
  );
});

PipelineToolsSection.displayName = 'PipelineToolsSection';

/** @type {MuiSx} */
const pipelineToolsSectionStyles = () => ({
  accordion: ({ palette }) => ({
    background: `${palette.background.default.tertiary} !important`,
  }),
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.75rem',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  groupTitle: ({ palette }) => ({
    color: palette.text.metrics,
    textTransform: 'uppercase',
  }),
});

export default PipelineToolsSection;
