import { memo, useEffect, useRef } from 'react';

import { Box, ClickAwayListener, Typography } from '@mui/material';

import MentionToolItem from './MentionToolItem';

const MentionToolList = memo(props => {
  const { tools, toolkitName, onSelectTool, highlightedIndex } = props;
  const styles = mentionToolListStyles();
  const containerRef = useRef(null);

  // Scroll the highlighted item into view, accounting for the sticky header.
  useEffect(() => {
    if (!containerRef.current || highlightedIndex < 0) return;
    const container = containerRef.current;
    const highlighted = container.querySelector('[data-highlighted="true"]');
    if (!highlighted) return;
    const stickyHeader = container.firstElementChild;
    const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 0;
    const containerRect = container.getBoundingClientRect();
    const itemRect = highlighted.getBoundingClientRect();
    const itemTopRelative = itemRect.top - containerRect.top;
    const itemBottomRelative = itemRect.bottom - containerRect.top;
    if (itemTopRelative < headerHeight) {
      container.scrollTop += itemTopRelative - headerHeight;
    } else if (itemBottomRelative > container.clientHeight) {
      container.scrollTop += itemBottomRelative - container.clientHeight;
    }
  }, [highlightedIndex]);

  const content = (
    <Box
      ref={containerRef}
      sx={styles.container}
    >
      <Box sx={styles.header}>
        <Typography
          variant="subtitle"
          color="text.primary"
        >
          {toolkitName} available tools
        </Typography>
      </Box>

      {tools.map((tool, index) => (
        <MentionToolItem
          key={tool.name}
          label={tool.name}
          description={tool.description}
          onClick={() => onSelectTool(tool.name)}
          isHighlighted={index === highlightedIndex}
        />
      ))}
    </Box>
  );

  return <ClickAwayListener onClickAway={() => onSelectTool(null)}>{content}</ClickAwayListener>;
});

MentionToolList.displayName = 'MentionToolList';

export default MentionToolList;

/** @type {MuiSx} */
const mentionToolListStyles = () => ({
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
});
