import { memo } from 'react';

import { Box, ClickAwayListener, Typography } from '@mui/material';

import ToolItem from './ToolItem';

const ToolList = memo(props => {
  const { tools, toolkitName, onSelectTool } = props;

  const content = (
    <Box sx={toolListStyles.container}>
      <Box sx={toolListStyles.header}>
        <Typography
          variant="subtitle"
          color="text.primary"
        >
          {toolkitName} available tools
        </Typography>
      </Box>

      {tools.map(tool => (
        <ToolItem
          key={tool.name}
          label={tool.name}
          description={tool.description}
          onClick={() => onSelectTool(tool.name)}
        />
      ))}
    </Box>
  );

  return <ClickAwayListener onClickAway={() => onSelectTool(null)}>{content}</ClickAwayListener>;
});

ToolList.displayName = 'ToolList';

export default ToolList;

/** @type {MuiSx} */
const toolListStyles = {
  container: ({ palette }) => ({
    border: `1px solid ${palette.border.lines}`,
    width: '100%',
    maxWidth: '100%',
    maxHeight: '15.4375rem',
    borderRadius: '1rem',
    boxSizing: 'border-box',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    background: palette.background.secondary,
    overflowY: 'auto',
  }),
  header: {
    position: 'sticky',
    top: '-0.75rem',
    zIndex: 1,
    height: '1rem',
    display: 'flex',
    alignItems: 'center',
    padding: '1rem .75rem',
    margin: '-0.75rem -0.75rem 0',
    background: 'inherit',
  },
};
