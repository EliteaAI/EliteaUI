import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const PendingInjectionItem = memo(props => {
  const { item, onRemove, hideDelete = true } = props;

  const handleRemove = useCallback(() => {
    onRemove(item.id);
  }, [item.id, onRemove]);

  const styles = pendingInjectionItemStyles();

  return (
    <Box
      sx={styles.chip}
      data-testid="interjection-queue-item"
    >
      <Typography
        component={Box}
        variant="bodyMedium"
        color="text.primary"
      >
        {item.text}
      </Typography>
      {!item.inFlight && !hideDelete && (
        <Tooltip
          title="Remove queued message"
          placement="top"
        >
          <BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            size="small"
            sx={styles.remove}
            aria-label="Remove queued message"
            title="Remove queued message"
            data-testid="interjection-queue-remove"
            onClick={handleRemove}
            startIcon={<DeleteIcon />}
          />
        </Tooltip>
      )}
    </Box>
  );
});

PendingInjectionItem.displayName = 'PendingInjectionItem';

/** @type {MuiSx} */
const pendingInjectionItemStyles = () => ({
  chip: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    backgroundColor: ({ palette }) => palette.background.section,
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    minWidth: 0,
  },
  remove: {
    alignSelf: 'flex-end',
  },
});

export default PendingInjectionItem;
