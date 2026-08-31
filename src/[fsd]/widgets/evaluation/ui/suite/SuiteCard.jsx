import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const SuiteCard = memo(props => {
  const { suite, datasetName, onDelete, onClick } = props;

  const handleDelete = useCallback(
    e => {
      e.stopPropagation();
      onDelete?.(suite);
    },
    [onDelete, suite],
  );

  const styles = suiteCardStyles();

  return (
    <Box
      sx={styles.root}
      onClick={onClick}
    >
      <Box sx={styles.header}>
        <Typography
          variant="bodyMedium"
          sx={styles.name}
        >
          {suite.name}
        </Typography>
        {onDelete && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            size="small"
            onClick={handleDelete}
            sx={styles.deleteButton}
            startIcon={<DeleteIcon sx={{ fontSize: '1rem' }} />}
          />
        )}
      </Box>
      <Typography
        variant="bodySmall"
        sx={styles.description}
      >
        {suite.description || '[No Description]'}
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.dataset}
      >
        Dataset: {datasetName || 'Not selected'}
      </Typography>
    </Box>
  );
});

SuiteCard.displayName = 'SuiteCard';

export default SuiteCard;

/** @type {MuiSx} */
const suiteCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.folder.default,
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s',
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
      borderColor: palette.border.lines,
    },
    '&:hover .MuiButton-root': {
      opacity: 1,
    },
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  name: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  deleteButton: ({ palette }) => ({
    opacity: 0,
    padding: '0.25rem',
    color: palette.icon.fill.default,
    transition: 'opacity 0.15s',
  }),
  description: ({ palette }) => ({
    color: palette.text.default,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minHeight: '1.25rem',
  }),
  dataset: ({ palette }) => ({
    color: palette.text.default,
  }),
});
