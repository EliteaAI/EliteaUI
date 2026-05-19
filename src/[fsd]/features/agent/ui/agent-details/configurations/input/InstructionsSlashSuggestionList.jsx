import { memo, useMemo } from 'react';

import { Box, ClickAwayListener, Typography } from '@mui/material';

import { MentionConstants } from '@/[fsd]/shared/lib/constants';
import { Mention } from '@/[fsd]/shared/ui';

/**
 * Dropdown rendered below the Instructions textarea while the user is in
 * 'items' or 'tools' phase.
 *
 * Props:
 *   phase        — 'idle' | 'items' | 'tools'
 *   itemQuery    — current filter text (typed after "/")
 *   toolQuery    — current tool filter text (typed after "#")
 *   items        — all mentionable items derived from version_details.tools
 *   filteredTools — tools pre-filtered by toolQuery (from useInstructionsMention)
 *   selectedItem  — the toolkit/MCP currently in 'tools' phase
 *   onSelectItem  — (item, isToolkit) => void
 *   onSelectTool  — (toolName | null) => void
 *   onClose       — () => void  (dismiss the dropdown)
 */
const InstructionsSlashSuggestionList = memo(props => {
  const { phase, itemQuery, items, filteredTools, selectedItem, onSelectItem, onSelectTool, onClose } = props;
  const styles = instructionsSlashSuggestionListStyles();
  // Filter items by itemQuery client-side for instant response.
  const filteredItems = useMemo(() => {
    if (!items?.length) return [];
    if (!itemQuery) return items;
    return items.filter(item => item.name.toLowerCase().includes(itemQuery.toLowerCase()));
  }, [items, itemQuery]);

  if (phase === MentionConstants.MentionPhase.Idle) return null;

  if (phase === MentionConstants.MentionPhase.Tools) {
    if (filteredTools.length === 0) return null;
    return (
      <Mention.MentionToolList
        tools={filteredTools}
        toolkitName={selectedItem?.name}
        onSelectTool={onSelectTool}
      />
    );
  }

  // phase === 'items'
  if (filteredItems.length === 0) return null;

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Box sx={styles.container}>
        <Box sx={styles.header}>
          <Typography
            variant="subtitle"
            color="text.primary"
          >
            Mention agent, pipeline or toolkit
          </Typography>
        </Box>
        {filteredItems.map(item => (
          <Mention.MentionToolItem
            key={item.name}
            label={item.name}
            description={item.description}
            onClick={() => onSelectItem(item, item.isToolkit)}
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
