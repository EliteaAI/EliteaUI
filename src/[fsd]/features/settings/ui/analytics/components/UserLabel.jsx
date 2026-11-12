import { memo } from 'react';

import { Box } from '@mui/material';

import DeletedChip from './DeletedChip';

const UserLabel = memo(props => {
  const { user, testId = 'analytics-user-deleted-chip', sx = {} } = props;

  const styles = userLabelStyles();

  return (
    <Box
      component="span"
      sx={[styles.root, sx]}
    >
      <Box
        component="span"
        className="user-label-name"
        sx={styles.name}
      >
        {user.user_email || `User ${user.user_id}`}
      </Box>
      {user.user_deleted && (
        <DeletedChip
          testId={testId}
          label="Deleted user"
        />
      )}
    </Box>
  );
});

UserLabel.displayName = 'UserLabel';

/** @type {MuiSx} */
const userLabelStyles = () => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
    maxWidth: '100%',
  },
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
});

export default UserLabel;
