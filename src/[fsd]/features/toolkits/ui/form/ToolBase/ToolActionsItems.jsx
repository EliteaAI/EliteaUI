import { memo } from 'react';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box } from '@mui/material';
import Stack from '@mui/material/Stack';

import Tooltip from '@/ComponentsLib/Tooltip';
import ChipWithCheckIcon from '@/components/ChipWithCheckIcon.jsx';

export const ToolActionsItems = memo(props => {
  const { toolsOptions, warningTools, selectedTools, onSelectTool, disabled, styles } = props;

  return (
    <Stack
      sx={styles.stack}
      useFlexGap
      flexWrap="wrap"
      direction="row"
      spacing={1}
    >
      {/* Render warning chips for selectedTools not in availableTools FIRST */}
      {/* TODO: DELETE type check after migration period (Q1 2026) - Legacy OpenAPI tools may be objects */}
      {warningTools.map(tool => {
        // Handle legacy OpenAPI toolkit format where tool might be an object with {name, path, method, description}
        const toolLabel =
          typeof tool === 'object' && tool !== null ? tool.name || JSON.stringify(tool) : tool;
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
      })}
      {/* Render normal available tools */}
      {toolsOptions.map(option => (
        <ChipWithCheckIcon
          clickable={!disabled}
          key={option.value}
          isSelected={selectedTools?.includes(option.value)}
          label={option.label}
          onClick={onSelectTool(option.value)}
          warning={false}
          sx={styles.chip}
        />
      ))}
    </Stack>
  );
});

ToolActionsItems.displayName = 'ToolActionsItems';

export default ToolActionsItems;
