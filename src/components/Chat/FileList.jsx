import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Button, ListItemIcon, Typography } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import AttachedFileIcon from '@/assets/attached-file-icon.svg?react';
import CloseIcon from '@/components/Icons/CloseIcon';
import useGetComponentWidth from '@/hooks/useGetComponentWidth';

const FileList = memo(({ files = [], onDeleteFile, disabledDelete }) => {
  const { componentWidth, componentRef } = useGetComponentWidth();
  const [maxItemsToShow, setMaxItemsToShow] = useState(3);
  const anchorRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const onClickRemove = useCallback(
    index => () => {
      if (!disabledDelete) {
        onDeleteFile?.(index);
      }
    },
    [disabledDelete, onDeleteFile],
  );

  const handleMoreClick = () => {
    setAnchorEl(anchorRef.current);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemRemove = useCallback(
    index => event => {
      if (!disabledDelete) {
        event.stopPropagation();
        onDeleteFile?.(index);
      }
    },
    [disabledDelete, onDeleteFile],
  );

  useEffect(() => {
    const maxCount = Math.floor((componentWidth || 0) / 208) || 1;
    if (maxCount < files.length) {
      setMaxItemsToShow(Math.floor((componentWidth > 60 ? componentWidth - 60 : 0) / 208) || 1);
    } else {
      setMaxItemsToShow(maxCount);
    }
  }, [files.length, componentWidth]);

  const visibleAttachments = files.slice(0, maxItemsToShow);
  const hiddenAttachments = files.slice(maxItemsToShow);

  return (
    <Box
      width="100%"
      minHeight="36px"
      display="flex"
      flexDirection="row"
      gap="8px"
      justifyContent="flex-start"
      flexWrap="wrap"
      ref={componentRef}
    >
      {visibleAttachments.map((attachment, index) => (
        <Box
          key={index}
          display="flex"
          flexDirection="row"
          width="200px"
          minWidth="200px"
          alignItems="center"
          padding="6px 12px"
          borderRadius="8px"
          height="36px"
          boxSizing="border-box"
          gap="12px"
          sx={styles.item}
        >
          <AttachedFileIcon />
          <TypographyWithConditionalTooltip
            title={attachment.name}
            placement="top"
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.itemName}
          >
            {attachment.name}
          </TypographyWithConditionalTooltip>
          <Box
            style={styles.itemRemove}
            onClick={onClickRemove(index)}
          >
            <CloseIcon fontSize="16px" />
          </Box>
        </Box>
      ))}

      {hiddenAttachments.length > 0 && (
        <>
          <Button
            ref={anchorRef}
            variant="alita"
            color="secondary"
            onClick={handleMoreClick}
            aria-label="Show more files"
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="menu"
            sx={styles.showMoreButton}
          >
            {`+${hiddenAttachments.length}`}
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            slotProps={{
              list: {
                'aria-labelledby': 'more-files-button',
              },
              paper: {
                sx: styles.paperMenu,
              },
            }}
          >
            {hiddenAttachments.map((attachment, index) => {
              const actualIndex = maxItemsToShow + index;
              return (
                <MenuItem
                  key={actualIndex}
                  sx={styles.menuItem}
                >
                  <ListItemIcon sx={styles.menuItemIcon}>
                    <AttachedFileIcon />
                  </ListItemIcon>
                  <Typography
                    variant="bodyMedium"
                    color="text.secondary"
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '180px',
                    }}
                  >
                    {attachment.name}
                  </Typography>
                  <Box
                    onClick={handleMenuItemRemove(actualIndex)}
                    sx={styles.menuItemRemove}
                  >
                    <CloseIcon fontSize="14px" />
                  </Box>
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}
    </Box>
  );
});

FileList.displayName = 'FileList';

const styles = {
  item: {
    background: theme => theme.palette.background.button.default,
  },
  itemName: {
    width: 'calc(100% - 60px)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemRemove: {
    cursor: 'pointer',
    width: '20px',
    height: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paperMenu: ({ palette }) => ({
    marginTop: '-4px',
    minWidth: '220px',
    maxWidth: '300px',
    maxHeight: '400px',
    overflow: 'auto',
    boxShadow: palette.boxShadow?.default,
    border: `1px solid ${palette.border?.lines}`,
    backgroundColor: palette.background.secondary,
    // Add higher specificity if needed
    '& .MuiList-root': {
      backgroundColor: palette.background.secondary,
    },
  }),
  showMoreButton: {
    borderRadius: '8px',
    minWidth: 'auto',
    height: '36px',
  },
  menuItem: ({ palette }) => ({
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  menuItemIcon: ({ palette }) => ({
    width: '16px',
    minWidth: '16px !important',
    color: palette.text.primary,
  }),
  menuItemRemove: ({ palette }) => ({
    cursor: 'pointer',
    width: '20px',
    height: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
};

export default FileList;
