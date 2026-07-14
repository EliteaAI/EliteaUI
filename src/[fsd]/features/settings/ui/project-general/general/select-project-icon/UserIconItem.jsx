import { memo, useCallback, useState } from 'react';

import { Box, IconButton } from '@mui/material';

import AlertDialog from '@/components/AlertDialog';
import CloseIcon from '@/components/Icons/CloseIcon';
import { useTheme } from '@emotion/react';

import IconItem from './ProjectIconItem';

const UserIconItem = memo(props => {
  const { isSelected, children, onDelete, onClick } = props;
  const theme = useTheme();
  const styles = userIconItemStyles();

  const [openAlert, setOpenAlert] = useState(false);

  const onCloseAlert = useCallback(() => setOpenAlert(false), []);

  const onClickDelete = useCallback(event => {
    event.stopPropagation();
    setOpenAlert(true);
  }, []);

  const onConfirmAlert = useCallback(() => {
    setOpenAlert(false);
    onDelete();
  }, [onDelete]);

  return (
    <>
      <Box sx={styles.wrapper}>
        <IconItem
          isSelected={isSelected}
          onClick={onClick}
        >
          {children}
        </IconItem>
        <IconButton
          className="deleteButton"
          variant="elitea"
          color="delete"
          onClick={onClickDelete}
          sx={styles.deleteButton}
        >
          <CloseIcon
            sx={styles.deleteIcon}
            fill={theme.palette.icon.fill.delete}
          />
        </IconButton>
      </Box>
      <AlertDialog
        title="Warning"
        alertContent="Are you sure to delete this icon?"
        open={openAlert}
        alarm
        onClose={onCloseAlert}
        onCancel={onCloseAlert}
        onConfirm={onConfirmAlert}
      />
    </>
  );
});

UserIconItem.displayName = 'UserIconItem';

/** @type {MuiSx} */
const userIconItemStyles = () => ({
  wrapper: {
    position: 'relative',
    overflow: 'visible',
    '&:hover .deleteButton': { visibility: 'visible' },
  },
  deleteButton: {
    visibility: 'hidden',
  },
  deleteIcon: {
    cursor: 'pointer',
    fontSize: '1rem',
  },
});

export default UserIconItem;
