import { memo, useCallback, useState } from 'react';

import { List, ListItemButton, ListItemText, Popover } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const KIND_LABELS = {
  added: 'added',
  removed: 'removed',
  changed: 'changed',
};

// "N nodes added" and the list of node ids it covers; picking an id scrolls both editors to it
const YamlNodeSummaryChip = memo(props => {
  const { kind, ids, onSelectNode } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);
  const handleSelect = useCallback(
    id => {
      setAnchorEl(null);
      onSelectNode?.(id);
    },
    [onSelectNode],
  );

  const styles = yamlNodeSummaryChipStyles(kind);
  const label = `${ids.length} ${ids.length === 1 ? 'node' : 'nodes'} ${KIND_LABELS[kind]}`;
  const listId = `compare-yaml-nodes-${kind}`;

  return (
    <>
      <BaseBtn
        variant={BUTTON_VARIANTS.secondary}
        size="small"
        onClick={handleOpen}
        aria-haspopup="listbox"
        aria-expanded={Boolean(anchorEl)}
        aria-controls={anchorEl ? listId : undefined}
        sx={styles.chip}
        data-testid={`compare-yaml-chip-${kind}`}
      >
        {label}
      </BaseBtn>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <List
          id={listId}
          dense
          role="listbox"
          aria-label={label}
          sx={styles.list}
        >
          {ids.map(id => (
            <ListItemButton
              key={id}
              role="option"
              onClick={() => handleSelect(id)}
              data-testid={`compare-yaml-node-${kind}-${id}`}
            >
              <ListItemText
                primary={id}
                slotProps={{ primary: { variant: 'bodySmall', sx: styles.id } }}
              />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </>
  );
});

YamlNodeSummaryChip.displayName = 'YamlNodeSummaryChip';

/** @type {MuiSx} */
const yamlNodeSummaryChipStyles = kind => ({
  chip: ({ palette }) => ({
    borderRadius: '1rem',
    backgroundColor:
      kind === 'added' ? palette.diff.added : kind === 'removed' ? palette.diff.removed : undefined,
  }),
  list: {
    maxHeight: '16rem',
    minWidth: '12rem',
    overflowY: 'auto',
  },
  id: {
    fontFamily: 'monospace',
  },
});

export default YamlNodeSummaryChip;
