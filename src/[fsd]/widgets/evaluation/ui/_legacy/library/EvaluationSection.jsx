import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';

import EvaluationItemRow from './EvaluationItemRow';

const EvaluationSection = memo(props => {
  const {
    title,
    items = [],
    testId,
    canCreate = false,
    canEdit = false,
    canDelete = false,
    isItemReadOnly,
    onAdd,
    onEdit,
    onDelete,
    addTooltip = 'Add',
    addTestId,
  } = props;

  const styles = evaluationSectionStyles();

  return (
    <Box
      sx={styles.section}
      data-testid={testId}
    >
      <Box sx={styles.header}>
        <Typography variant="labelMedium">
          {title} ({items.length})
        </Typography>
        {canCreate && (
          <Box data-testid={addTestId}>
            <Button.AddButton
              onAdd={onAdd}
              tooltip={addTooltip}
            />
          </Box>
        )}
      </Box>

      {items.length === 0 ? (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          None defined yet.
        </Typography>
      ) : (
        <Box sx={styles.list}>
          {items.map(item => (
            <EvaluationItemRow
              key={item.id}
              item={item}
              readOnly={isItemReadOnly ? isItemReadOnly(item) : false}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

EvaluationSection.displayName = 'EvaluationSection';

/** @type {MuiSx} */
const evaluationSectionStyles = () => ({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
});

export default EvaluationSection;
