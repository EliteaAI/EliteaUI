import { memo, useEffect, useRef } from 'react';

import { Box, ClickAwayListener, Typography } from '@mui/material';

import { MentionConstants } from '@/[fsd]/shared/lib/constants';
import { Mention } from '@/[fsd]/shared/ui';

const HEADER_LABEL = 'Mention skill';
const EMPTY_LABEL = 'No skills attached to this agent';

/**
 * Dropdown rendered below the Instructions textarea while the user is in the
 * "~" skill-mention 'items' phase. Lists ONLY the skills attached to the current
 * agent version.
 *
 * Props:
 *   phase            — 'idle' | 'items'
 *   filteredItems    — pre-filtered attached-skill list (from useInstructionsSkillMention)
 *   committedMentions — [{name, tool_name}] already mentioned in instructions
 *   highlightedIndex — keyboard-highlighted row index (-1 = none)
 *   onSelectItem     — (item) => void
 *   onClose          — () => void  (dismiss the dropdown)
 */
const InstructionsSkillSuggestionList = memo(props => {
  const { phase, filteredItems, committedMentions, highlightedIndex, onSelectItem, onClose } = props;
  const styles = instructionsSkillSuggestionListStyles();
  const containerRef = useRef(null);

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
            {HEADER_LABEL}
          </Typography>
        </Box>
        {filteredItems.length === 0 ? (
          <Box sx={styles.empty}>
            <Typography
              variant="bodySmall"
              color="text.secondary"
            >
              {EMPTY_LABEL}
            </Typography>
          </Box>
        ) : (
          filteredItems.map((item, index) => (
            <Mention.MentionToolItem
              key={item.name}
              label={item.name}
              description={item.description}
              onClick={() => onSelectItem(item)}
              isHighlighted={index === highlightedIndex}
              isSelected={committedMentions?.some(m => m.name === item.name) ?? false}
            />
          ))
        )}
      </Box>
    </ClickAwayListener>
  );
});

InstructionsSkillSuggestionList.displayName = 'InstructionsSkillSuggestionList';

export default InstructionsSkillSuggestionList;

/** @type {MuiSx} */
const instructionsSkillSuggestionListStyles = () => ({
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
  empty: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
  },
});
