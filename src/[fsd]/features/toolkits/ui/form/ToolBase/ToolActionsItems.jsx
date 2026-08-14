import { memo } from 'react';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';

import Tooltip from '@/ComponentsLib/Tooltip';
import ToolGroupHeader from '@/[fsd]/features/toolkits/ui/form/ToolBase/ToolGroupHeader';
import ChipWithCheckIcon from '@/components/ChipWithCheckIcon.jsx';

const UNCLASSIFIED_GROUP = 'unclassified';

const TOOL_GROUP_ORDER = [
  { key: 'read', label: 'Read only', tooltip: 'Returns data. Nothing is created, changed or destroyed.' },
  { key: 'write', label: 'Change data', tooltip: 'Creates or modifies data in the target system.' },
  { key: 'delete', label: 'Destructive', tooltip: 'Destroys data. Not reversible from Elitea.' },
  {
    key: 'execute',
    label: 'Unrestricted',
    tooltip:
      'Runs a caller-supplied query, script, pipeline or raw API call. Effect is not bounded by the tool.',
  },
  {
    key: UNCLASSIFIED_GROUP,
    label: 'Unclassified',
    tooltip: 'Not classified yet. Treated as a tool that changes data.',
  },
];

// Unknown group values must land in Unclassified, never disappear
const KNOWN_GROUPS = new Set(
  TOOL_GROUP_ORDER.map(group => group.key).filter(key => key !== UNCLASSIFIED_GROUP),
);

const matchesSearch = (option, query) =>
  !query ||
  (option.label || '').toLowerCase().includes(query) ||
  String(option.value).toLowerCase().includes(query);

export const ToolActionsItems = memo(props => {
  const {
    toolsOptions,
    toolGroups,
    warningTools,
    selectedTools,
    onSelectTool,
    onToggleTools,
    searchTerm = '',
    disabled,
    styles,
  } = props;

  const hasGroups = toolGroups && Object.keys(toolGroups).length > 0;
  const query = searchTerm.trim().toLowerCase();

  const renderWarningChips = () =>
    warningTools.map(tool => {
      // Handle legacy OpenAPI toolkit format where tool might be an object with {name, path, method, description}
      const toolLabel = typeof tool === 'object' && tool !== null ? tool.name || JSON.stringify(tool) : tool;
      const toolValue = typeof tool === 'object' && tool !== null ? tool.name : tool;
      return (
        <Tooltip
          key={toolValue}
          title="Tool is not available"
          placement="top"
        >
          <Box component="span">
            <ChipWithCheckIcon
              testId={`toolkit-tool-chip-${toolValue}`}
              clickable={!disabled}
              isSelected
              label={toolLabel}
              onClick={onSelectTool(toolValue)}
              warning
              icon={
                <ErrorOutlineIcon
                  fontSize="small"
                  color="warning"
                />
              }
              sx={styles.chip}
            />
          </Box>
        </Tooltip>
      );
    });

  const renderChip = option => (
    <ChipWithCheckIcon
      testId={`toolkit-tool-chip-${option.value}`}
      clickable={!disabled}
      key={option.value}
      isSelected={selectedTools?.includes(option.value)}
      label={option.label}
      onClick={onSelectTool(option.value)}
      warning={false}
      sx={styles.chip}
    />
  );

  const renderNoMatches = () => (
    <Typography
      variant="bodySmall"
      color="text.secondary"
      data-testid="toolkit-tools-no-matches"
    >
      No tools match “{searchTerm.trim()}”.
    </Typography>
  );

  if (!hasGroups) {
    const visibleOptions = toolsOptions.filter(option => matchesSearch(option, query));
    return (
      <Stack
        sx={styles.stack}
        useFlexGap
        flexWrap="wrap"
        direction="row"
        spacing={1}
      >
        {renderWarningChips()}
        {visibleOptions.map(renderChip)}
        {query && !visibleOptions.length && renderNoMatches()}
      </Stack>
    );
  }

  const groupSections = TOOL_GROUP_ORDER.map(group => {
    const groupOptions = toolsOptions
      .filter(option =>
        group.key === UNCLASSIFIED_GROUP
          ? !KNOWN_GROUPS.has(toolGroups[option.value])
          : toolGroups[option.value] === group.key,
      )
      .sort((a, b) => (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase()));
    const visibleOptions = groupOptions.filter(option => matchesSearch(option, query));
    return { ...group, groupOptions, visibleOptions };
  }).filter(group => group.groupOptions.length > 0);

  const nothingMatches = query && groupSections.every(group => !group.visibleOptions.length);

  return (
    <Stack
      sx={styles.stack}
      direction="column"
    >
      {warningTools.length > 0 && (
        <Stack
          useFlexGap
          flexWrap="wrap"
          direction="row"
          spacing={1}
        >
          {renderWarningChips()}
        </Stack>
      )}
      {nothingMatches && renderNoMatches()}
      {groupSections.map(group => {
        if (query && !group.visibleOptions.length) return null;
        const groupValues = group.groupOptions.map(option => option.value);
        const selectedCount = groupValues.filter(value => selectedTools?.includes(value)).length;
        return (
          <Box
            key={group.key}
            data-testid={`tool-group-${group.key}`}
          >
            <ToolGroupHeader
              groupKey={group.key}
              label={group.label}
              tooltip={group.tooltip}
              selectedCount={selectedCount}
              totalCount={groupValues.length}
              onToggleAll={() => onToggleTools(groupValues, selectedCount === groupValues.length)}
              disabled={disabled}
            />
            <Stack
              useFlexGap
              flexWrap="wrap"
              direction="row"
              spacing={1}
            >
              {group.visibleOptions.map(renderChip)}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
});

ToolActionsItems.displayName = 'ToolActionsItems';

export default ToolActionsItems;
