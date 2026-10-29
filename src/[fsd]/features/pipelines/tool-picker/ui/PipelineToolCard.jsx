import { memo, useCallback, useState } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import {
  PICKER_KINDS,
  PIPELINE_TOOL_CARD_ACTION_CLASS,
} from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';
import { getToolkitDisplayName } from '@/[fsd]/features/toolkits/lib/helpers/toolkits.helpers';
import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import EnhancedCardToolActions from '@/pages/Applications/Components/Tools/CardActions/EnhancedCardToolActions';

import PickerEntityIcon from './PickerEntityIcon';
import PickerMcpStatus from './PickerMcpStatus';
import PipelineToolCardActions from './PipelineToolCardActions';
import PipelineToolVersionLabel from './PipelineToolVersionLabel';

// toolkits.helpers by file: the toolkits barrel reaches the node components, which import this slice back

const ENTITY_LABELS = {
  [PICKER_KINDS.toolkit]: 'toolkit',
  [PICKER_KINDS.mcp]: 'MCP',
  [PICKER_KINDS.agent]: 'agent',
  [PICKER_KINDS.pipeline]: 'pipeline',
};

/**
 * Read-only card of a pipeline attachment, in the look of the agent tool card: icon, name, version or
 * "Show tools", and the nodes that use it. `onRemove` is passed only for items no node uses.
 */
const PipelineToolCard = memo(props => {
  const { tool, kind, usedBy = [], onSelectNode, onRemove } = props;

  const [showTools, setShowTools] = useState(false);
  const toggleTools = useCallback(() => setShowTools(prev => !prev), []);

  const isApplication = kind === PICKER_KINDS.agent || kind === PICKER_KINDS.pipeline;
  const name = isApplication ? tool.name : getToolkitDisplayName(tool);
  const exposedTools = (tool.settings?.selected_tools || []).map(item =>
    typeof item === 'string' ? item : item?.name,
  );
  // Same labels as the agent tool card; every listed tool is exposed, so all are checked
  const toolOptions = exposedTools.map(toolName => ({
    value: toolName,
    label: (toolName.charAt(0).toUpperCase() + toolName.slice(1)).replaceAll('_', ' '),
  }));
  const styles = pipelineToolCardStyles(showTools);

  return (
    <Box
      sx={styles.root}
      data-testid="pipeline-tool-card"
    >
      <Box sx={styles.header}>
        <PickerEntityIcon
          source={tool}
          mcp={kind === PICKER_KINDS.mcp}
          isApplication={isApplication}
          isPipeline={kind === PICKER_KINDS.pipeline}
          large
        />
        <Box sx={styles.content}>
          <TypographyWithConditionalTooltip
            title={name}
            placement="right"
            variant="bodyMedium"
            component="div"
            color="text.secondary"
            sx={styles.ellipsis}
            data-testid="pipeline-tool-card-name"
          >
            {name}
          </TypographyWithConditionalTooltip>
          {isApplication ? (
            <PipelineToolVersionLabel tool={tool} />
          ) : exposedTools.length ? (
            <Box
              component="span"
              role="button"
              tabIndex={0}
              aria-expanded={showTools}
              onClick={toggleTools}
              onKeyDown={event => (event.key === 'Enter' || event.key === ' ') && toggleTools()}
              sx={styles.toolsToggle}
              data-testid="pipeline-tool-card-show-tools"
            >
              <Typography
                variant="bodySmall2"
                color="inherit"
              >
                {showTools ? 'Hide tools' : 'Show tools'}
              </Typography>
              <ArrowRightIcon
                fill="currentColor"
                style={styles.toolsToggleIcon}
              />
            </Box>
          ) : (
            <Typography
              variant="bodySmall"
              color="text.primary"
              noWrap
            >
              {tool.description}
            </Typography>
          )}
        </Box>
        <PipelineToolCardActions
          tool={tool}
          name={name}
          entityLabel={ENTITY_LABELS[kind]}
          onRemove={onRemove}
        />
        {kind === PICKER_KINDS.mcp && <PickerMcpStatus mcp={tool} />}
      </Box>

      {usedBy.length > 0 ? (
        <Box sx={styles.usage}>
          <Typography
            variant="labelTiny"
            sx={styles.usageText}
          >
            Used by
          </Typography>
          {usedBy.map(nodeId => (
            <Chip
              key={nodeId}
              size="small"
              label={
                <Typography
                  variant="labelTiny"
                  sx={styles.usageText}
                >
                  {nodeId}
                </Typography>
              }
              sx={styles.nodeChip}
              onClick={onSelectNode ? () => onSelectNode(nodeId) : undefined}
              data-testid="pipeline-tool-card-used-by"
            />
          ))}
        </Box>
      ) : (
        <Box sx={styles.usage}>
          <Typography
            variant="labelTiny"
            sx={styles.usageText}
            data-testid="pipeline-tool-card-not-used"
          >
            Not used by any node
          </Typography>
        </Box>
      )}

      {showTools && (
        <Box
          sx={styles.tools}
          data-testid="pipeline-tool-card-tools"
        >
          <EnhancedCardToolActions
            toolOptions={toolOptions}
            selectedTools={exposedTools}
            showActions
            disabled
          />
        </Box>
      )}
    </Box>
  );
});

PipelineToolCard.displayName = 'PipelineToolCard';

/** @type {MuiSx} */
const pipelineToolCardStyles = showTools => ({
  root: ({ palette }) => ({
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.default}`,
    backgroundColor: palette.background.surface.interactive.default,
    overflow: 'hidden',
    [`& .${PIPELINE_TOOL_CARD_ACTION_CLASS}`]: { display: 'none' },
    [`&:hover .${PIPELINE_TOOL_CARD_ACTION_CLASS}, &:focus-within .${PIPELINE_TOOL_CARD_ACTION_CLASS}`]: {
      display: 'flex',
    },
    ...(!showTools && {
      '&:hover': {
        borderColor: palette.border.lines,
        backgroundColor: palette.components.toolCard.background.hover,
      },
    }),
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    minHeight: '3.75rem',
    padding: '0.5rem 1rem',
    boxSizing: 'border-box',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: '1 1 0',
    minWidth: 0,
  },
  ellipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  toolsToggle: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: '0.25rem',
    cursor: 'pointer',
    color: palette.text.primary,
    outline: 'none',
    '&:hover, &:focus-visible': {
      color: palette.components.button.text.create,
    },
  }),
  toolsToggleIcon: {
    width: '1rem',
    height: '1rem',
    transform: showTools ? 'rotate(90deg)' : 'none',
    transition: 'transform 0.2s',
  },
  // Lines up with the name, past the icon tile
  usage: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0 1rem 0.5rem 4.125rem',
  },
  // Read-only: nodes decide the tools, so the chips can't be toggled here
  tools: {
    '& [data-testid^="toolkit-card-tool-item-"]': { cursor: 'default' },
  },
  usageText: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  nodeChip: ({ palette }) => ({
    height: '1rem',
    '& .MuiChip-label': { padding: '0 0.375rem' },
    maxWidth: '100%',
    backgroundColor: palette.components.chip.background.default,
  }),
});

export default PipelineToolCard;
