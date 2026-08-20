import { memo } from 'react';

import { Box, IconButton, Tooltip } from '@mui/material';

import { useProjectType } from '@/[fsd]/shared/lib/hooks/useProjectType.hooks';
import { PERMISSIONS } from '@/common/constants';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

const IndexDetailsDeleteAction = memo(props => {
  const { disabled = false, onDelete } = props;
  const { isPrivate } = useProjectType();
  const { checkPermission } = useCheckPermission();
  const styles = indexDetailsDeleteActionStyles();

  if (!isPrivate && !checkPermission(PERMISSIONS.index.delete)) return null;

  return (
    <Tooltip
      title={disabled ? 'Unavailable while indexing is in progress' : 'Delete index'}
      placement="top"
    >
      <Box
        component="span"
        sx={{ display: 'inline-flex' }}
      >
        <IconButton
          variant="elitea"
          color="secondary"
          aria-label="Delete index"
          data-testid="index-details-delete"
          disabled={disabled}
          onClick={onDelete}
        >
          <DeleteIcon sx={styles.icon} />
        </IconButton>
      </Box>
    </Tooltip>
  );
});

IndexDetailsDeleteAction.displayName = 'IndexDetailsDeleteAction';

/** @type {MuiSx} */
const indexDetailsDeleteActionStyles = () => ({
  icon: {
    fontSize: '1rem',
  },
});

export default IndexDetailsDeleteAction;
