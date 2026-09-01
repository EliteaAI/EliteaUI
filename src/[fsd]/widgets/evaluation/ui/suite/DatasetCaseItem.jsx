import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_PERMISSIONS } from '../../lib/constants';

const DatasetCaseItem = memo(props => {
  const { caseItem, onEdit, onDelete } = props;

  const { checkPermission } = useCheckPermission();
  const canUpdateDataset = checkPermission(EVAL_PERMISSIONS.datasetUpdate);

  const handleEdit = useCallback(
    event => {
      event.stopPropagation();
      onEdit?.(caseItem);
    },
    [onEdit, caseItem],
  );

  const handleDelete = useCallback(
    event => {
      event.stopPropagation();
      onDelete?.(caseItem);
    },
    [onDelete, caseItem],
  );

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
      {canUpdateDataset && (
        <Box
          className="case-actions"
          sx={styles.actions}
        >
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            onClick={handleEdit}
            sx={styles.actionButton}
          >
            <EditIcon />
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            onClick={handleDelete}
            sx={styles.actionButton}
          >
            <DeleteIcon />
          </Button.BaseBtn>
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

    ':hover': {
      cursor: 'pointer',
    },

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
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
    '& svg path': {
      fill: palette.icon.fill.default,
    },
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
});

export default DatasetCaseItem;
