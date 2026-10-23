import { memo, useMemo } from 'react';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';

import Tooltip from '@/ComponentsLib/Tooltip';
import { ToolGroupConstants } from '@/[fsd]/features/toolkits/lib/constants';
import ToolGroupHeader from '@/[fsd]/features/toolkits/ui/form/tool-base/ToolGroupHeader';
import ChipWithCheckIcon from '@/components/ChipWithCheckIcon.jsx';

const { UNCLASSIFIED_GROUP, TOOL_GROUP_ORDER, KNOWN_GROUPS } = ToolGroupConstants;

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
  const itemStyles = toolActionsItemsStyles();

  const hasGroups = toolGroups && Object.keys(toolGroups).length > 0;
  const query = searchTerm.trim().toLowerCase();

  const groupSections = useMemo(() => {
    if (!hasGroups) return [];
    return TOOL_GROUP_ORDER.map(group => {
      const groupOptions = toolsOptions
        .filter(option =>
          group.key === UNCLASSIFIED_GROUP
            ? !KNOWN_GROUPS.has(toolGroups[option.value])
            : toolGroups[option.value] === group.key,
        )
        .sort((a, b) => (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase()));
      return {
        ...group,
        groupOptions,
        values: groupOptions.map(option => option.value),
        visibleOptions: groupOptions.filter(option => matchesSearch(option, query)),
      };
    }).filter(group => group.groupOptions.length > 0);
  }, [hasGroups, toolsOptions, toolGroups, query]);

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
        sx={[itemStyles.wrap, styles.stack]}
        useFlexGap
        direction="row"
        spacing={1}
      >
        {renderWarningChips()}
        {visibleOptions.map(renderChip)}
        {query && !visibleOptions.length && renderNoMatches()}
      </Stack>
    );
  }

  const nothingMatches = query && groupSections.every(group => !group.visibleOptions.length);

  return (
    <Stack
      sx={styles.groupStack(!!query)}
      direction="column"
    >
      {warningTools.length > 0 && (
        <Stack
          sx={itemStyles.wrap}
          useFlexGap
          direction="row"
          spacing={1}
        >
          {renderWarningChips()}
        </Stack>
      )}
      {nothingMatches && renderNoMatches()}
      {groupSections
        .filter(group => !query || group.visibleOptions.length)
        .map(group => (
          <Box
            key={group.key}
            data-testid={`tool-group-${group.key}`}
          >
            <ToolGroupHeader
              groupKey={group.key}
              label={group.label}
              tooltip={group.tooltip}
              values={group.values}
              selectedCount={group.values.filter(value => selectedTools?.includes(value)).length}
              matchCount={group.visibleOptions.length}
              isSearching={!!query}
              onToggleTools={onToggleTools}
              disabled={disabled}
            />
            <Stack
              sx={itemStyles.wrap}
              useFlexGap
              direction="row"
              spacing={1}
            >
              {group.visibleOptions.map(renderChip)}
            </Stack>
          </Box>
        ))}
    </Stack>
  );
});

ToolActionsItems.displayName = 'ToolActionsItems';

/** @type {MuiSx} */
const toolActionsItemsStyles = () => ({
  wrap: {
    flexWrap: 'wrap',
  },
});

export default ToolActionsItems;
