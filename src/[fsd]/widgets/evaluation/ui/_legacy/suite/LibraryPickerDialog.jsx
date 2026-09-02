import { memo, useCallback, useMemo, useState } from 'react';

import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const LibraryPickerDialog = memo(props => {
  const { open, onClose, title = 'Add from library', items = [], onAttach, attaching = false } = props;

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(item => item.name?.toLowerCase().includes(term));
  }, [items, search]);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setSearch('');
    onClose?.();
  }, [onClose]);

  const handleAttach = useCallback(() => {
    const item = items.find(i => i.id === selectedId);
    if (item) onAttach?.(item);
  }, [items, selectedId, onAttach]);

  const styles = libraryPickerDialogStyles();

  const content = (
    <Box sx={styles.content}>
      <Input.InputBase
        fullWidth
        variant="standard"
        placeholder="Search…"
        value={search}
        onChange={event => setSearch(event.target.value)}
        data-testid="library-picker-search"
      />
      {filtered.length === 0 ? (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          Nothing available to add.
        </Typography>
      ) : (
        <List
          sx={styles.list}
          data-testid="library-picker-list"
        >
          {filtered.map(item => (
            <ListItemButton
              key={item.id}
              selected={item.id === selectedId}
              onClick={() => setSelectedId(item.id)}
              data-testid={`library-picker-item-${item.id}`}
            >
              <ListItemText
                primary={item.name}
                secondary={item.description || undefined}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );

  const actions = (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={handleClose}
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        disabled={attaching || selectedId == null}
        onClick={handleAttach}
        data-testid="library-picker-attach"
      >
        Add
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={title}
      onClose={handleClose}
      content={content}
      actions={actions}
      data-testid="library-picker-dialog"
    />
  );
});

LibraryPickerDialog.displayName = 'LibraryPickerDialog';

/** @type {MuiSx} */
const libraryPickerDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minWidth: '28rem',
  },
  list: {
    maxHeight: '20rem',
    overflowY: 'auto',
  },
});

export default LibraryPickerDialog;
