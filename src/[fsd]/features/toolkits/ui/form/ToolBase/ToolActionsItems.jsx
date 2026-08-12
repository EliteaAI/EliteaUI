import { memo } from 'react';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';

import Tooltip from '@/ComponentsLib/Tooltip';
import ChipWithCheckIcon from '@/components/ChipWithCheckIcon.jsx';

const UNCLASSIFIED_GROUP = 'unclassified';

const TOOL_GROUP_ORDER = [
  { key: 'read', label: 'Read', badge: 'Read-only', color: '#2e7d32' },
  { key: 'write', label: 'Create & update', badge: 'Changes data', color: '#ed6c02' },
  { key: 'delete', label: 'Delete', badge: 'Destructive', color: '#d32f2f' },
  { key: 'execute', label: 'Execute', badge: 'Unrestricted', color: '#d32f2f' },
  { key: UNCLASSIFIED_GROUP, label: 'Unclassified', badge: 'Not classified', color: '#9e9e9e' },
];

// Unknown group values must land in Unclassified, never disappear
const KNOWN_GROUPS = new Set(
  TOOL_GROUP_ORDER.map(group => group.key).filter(key => key !== UNCLASSIFIED_GROUP),
);

export const ToolActionsItems = memo(props => {
  const { toolsOptions, toolGroups, warningTools, selectedTools, onSelectTool, disabled, styles } = props;

  const hasGroups = toolGroups && Object.keys(toolGroups).length > 0;

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
      clickable={!disabled}
      key={option.value}
      isSelected={selectedTools?.includes(option.value)}
      label={option.label}
      onClick={onSelectTool(option.value)}
      warning={false}
      sx={styles.chip}
    />
  );

  if (!hasGroups) {
    return (
      <Stack
        sx={styles.stack}
        useFlexGap
        flexWrap="wrap"
        direction="row"
        spacing={1}
      >
        {renderWarningChips()}
        {toolsOptions.map(renderChip)}
      </Stack>
    );
  }

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
      {TOOL_GROUP_ORDER.map(group => {
        const groupOptions = toolsOptions
          .filter(option =>
            group.key === UNCLASSIFIED_GROUP
              ? !KNOWN_GROUPS.has(toolGroups[option.value])
              : toolGroups[option.value] === group.key,
          )
          .sort((a, b) => (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase()));
        if (!groupOptions.length) return null;
        const selectedCount = groupOptions.filter(option => selectedTools?.includes(option.value)).length;
        return (
          <Box
            key={group.key}
            data-testid={`tool-group-${group.key}`}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ marginBottom: '0.5rem' }}
            >
              <Box
                sx={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  backgroundColor: group.color,
                }}
              />
              <Typography variant="labelSmall">{group.label}</Typography>
              <Typography
                variant="labelSmall"
                color="text.secondary"
              >
                {group.badge} · {selectedCount} / {groupOptions.length}
              </Typography>
            </Stack>
            <Stack
              useFlexGap
              flexWrap="wrap"
              direction="row"
              spacing={1}
            >
              {groupOptions.map(renderChip)}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
});

ToolActionsItems.displayName = 'ToolActionsItems';

export default ToolActionsItems;
