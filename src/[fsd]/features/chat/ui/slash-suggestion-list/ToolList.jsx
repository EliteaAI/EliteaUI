import { memo, useRef } from 'react';

import { Box, CircularProgress, ClickAwayListener, Typography } from '@mui/material';

import useScrollActiveIntoView from '@/[fsd]/shared/lib/hooks/useScrollActiveIntoView.hooks';

import ToolItem from './ToolItem';

const ToolList = memo(props => {
  const { tools, toolkitName, onSelectTool, activeIndex, isLoading } = props;

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const { itemRefs } = useScrollActiveIntoView(activeIndex, containerRef, headerRef);

  const content = (
    <Box
      ref={containerRef}
      sx={toolListStyles.container}
    >
      <Box
        ref={headerRef}
        sx={toolListStyles.header}
      >
        <Typography
          variant="subtitle"
          color="text.primary"
        >
          {toolkitName} available tools
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={toolListStyles.loader}>
          <CircularProgress size="1.25rem" />
        </Box>
      ) : (
        tools.map((tool, idx) => (
          <ToolItem
            key={tool.name}
            label={tool.name}
            description={tool.description}
            onClick={() => onSelectTool(tool.name)}
            isActive={idx === activeIndex}
            itemRef={el => {
              itemRefs.current[idx] = el;
            }}
          />
        ))
      )}
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
  loader: {
    display: 'flex',
    justifyContent: 'center',
    padding: '0.5rem 0',
  },
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
