import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditPenIcon from '@/components/Icons/EditPenIcon';

/**
 * Case item displayed in Suite view.
 * - Edit: only for non-shared datasets (shared cases must be edited from Manage Datasets)
 * - Remove: only for non-shared datasets (TODO: will call unbind endpoint when BE is ready)
 */
const DatasetCaseItem = memo(props => {
  const { caseItem, canEdit = false, canRemove = false, onEdit, onRemove } = props;

  const handleEdit = useCallback(
    event => {
      event.stopPropagation();
      onEdit?.(caseItem);
    },
    [onEdit, caseItem],
  );

  const handleRemove = useCallback(
    event => {
      event.stopPropagation();
      onRemove?.(caseItem);
    },
    [onRemove, caseItem],
  );

  const showActions = canEdit || canRemove;

  const styles = datasetCaseItemStyles();

  return (
    <Box sx={styles.root}>
      <Box
        className="case-content"
        sx={styles.content}
      >
        <Typography sx={styles.text}>
          <Box
            component="span"
            sx={styles.label}
          >
            Input:
          </Box>{' '}
          {caseItem.input}
        </Typography>
        <Typography sx={styles.text}>
          <Box
            component="span"
            sx={styles.label}
          >
            Output:
          </Box>{' '}
          {caseItem.expected_output}
        </Typography>
      </Box>
      {showActions && (
        <Box
          className="case-actions"
          sx={styles.actions}
        >
          {canEdit && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              onClick={handleEdit}
              sx={styles.actionButton}
              data-testid={`case-edit-${caseItem.id}`}
            >
              <EditPenIcon sx={styles.actionIcon} />
            </Button.BaseBtn>
          )}
          {canRemove && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              onClick={handleRemove}
              sx={styles.actionButton}
              data-testid={`case-remove-${caseItem.id}`}
            >
              <DeleteIcon sx={styles.actionIcon} />
            </Button.BaseBtn>
          )}
        </Box>
      )}
    </Box>
  );
});

DatasetCaseItem.displayName = 'DatasetCaseItem';

/** @type {MuiSx} */
const datasetCaseItemStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    padding: '0.5rem 0',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,

    '& .case-actions': {
      opacity: 0,
      transition: 'opacity 0.15s ease',
    },

    '&:hover .case-actions': {
      opacity: 1,
    },

    '&:hover .case-content': {
      paddingRight: '4.75rem',
    },
  }),
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    transition: 'padding-right 0.15s ease',
  },
  text: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: '1.25rem',
    color: palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',

    ':last-of-type': {
      marginBottom: '0.25rem',
    },
  }),
  label: ({ palette }) => ({
    fontWeight: 500,
    color: palette.text.secondary,
  }),
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  actionButton: ({ palette }) => ({
    minWidth: 'unset',
    padding: '0.25rem',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  actionIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
});

export default DatasetCaseItem;
