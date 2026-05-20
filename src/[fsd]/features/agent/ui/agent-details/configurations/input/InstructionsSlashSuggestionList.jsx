import { memo, useEffect, useRef } from 'react';

import { Box, ClickAwayListener, Typography } from '@mui/material';

import { MentionConstants } from '@/[fsd]/shared/lib/constants';
import { Mention } from '@/[fsd]/shared/ui';

/**
 * Dropdown rendered below the Instructions textarea while the user is in
 * 'items' or 'tools' phase.
 *
 * Props:
 *   phase            — 'idle' | 'items' | 'tools'
 *   filteredItems    — pre-filtered item list (from useInstructionsMention)
 *   filteredTools    — tools pre-filtered by toolQuery (from useInstructionsMention)
 *   selectedItem     — the toolkit/MCP currently in 'tools' phase
 *   committedMentions — [{name, tool_name}] already mentioned in instructions
 *   highlightedIndex — keyboard-highlighted row index (-1 = none)
 *   onSelectItem     — (item, isToolkit) => void
 *   onSelectTool     — (toolName | null) => void
 *   onClose          — () => void  (dismiss the dropdown)
 */
const InstructionsSlashSuggestionList = memo(props => {
  const {
    phase,
    filteredItems,
    filteredTools,
    selectedItem,
    committedMentions,
    highlightedIndex,
    onSelectItem,
    onSelectTool,
    onClose,
  } = props;
  const styles = instructionsSlashSuggestionListStyles();
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

  if (phase === MentionConstants.MentionPhase.Idle) return null;

  if (phase === MentionConstants.MentionPhase.Tools) {
    if (filteredTools.length === 0) return null;
    return (
      <Mention.MentionToolList
        tools={filteredTools}
        toolkitName={selectedItem?.name}
        onSelectTool={onSelectTool}
        highlightedIndex={highlightedIndex}
      />
    );
  }

  // phase === 'items'
  if (filteredItems.length === 0) return null;

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Box
        ref={containerRef}
        sx={styles.container}
      >
        <Box sx={styles.header}>
          <Typography
            variant="subtitle"
            color="text.primary"
          >
            Mention toolkit, mcp, agent or pipeline
          </Typography>
        </Box>
        {filteredItems.map((item, index) => (
          <Mention.MentionToolItem
            key={item.name}
            label={item.name}
            description={item.description}
            onClick={() => onSelectItem(item, item.isToolkit)}
            isHighlighted={index === highlightedIndex}
            isSelected={committedMentions?.some(m => m.name === item.name) ?? false}
          />
        ))}
      </Box>
    </ClickAwayListener>
  );
});

InstructionsSlashSuggestionList.displayName = 'InstructionsSlashSuggestionList';

export default InstructionsSlashSuggestionList;

/** @type {MuiSx} */
const instructionsSlashSuggestionListStyles = () => ({
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
