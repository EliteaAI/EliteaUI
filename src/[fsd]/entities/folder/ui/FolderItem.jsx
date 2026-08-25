import { memo, useCallback } from 'react';

import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PinIconFilled from '@/assets/pin-filled-icon.svg?react';
import FolderIcon from '@/components/Icons/FolderIcon';

const FolderItem = memo(props => {
  const { folder, isSelected, onClick, onMenuClick } = props;

  const isPinned = !!folder.meta?.is_pinned;
  const styles = folderItemStyles(isSelected);

  const handleClick = useCallback(() => {
    onClick?.(folder);
  }, [folder, onClick]);

  const handleMenuClick = useCallback(
    e => {
      e.stopPropagation();
      onMenuClick?.(e, folder);
    },
    [folder, onMenuClick],
  );

  return (
    <Box
      sx={styles.container}
      onClick={handleClick}
      data-testid={`folder-item-${folder.id}`}
    >
      <FolderIcon sx={styles.icon} />
      <Box sx={styles.nameGroup}>
        <Typography
          variant="labelSmall"
          sx={styles.name}
        >
          {folder.name}
        </Typography>
        {folder.entities_count != null && (
          <Typography
            variant="labelSmall"
            sx={styles.count}
          >
            ({folder.entities_count})
          </Typography>
        )}
        {isPinned && (
          <Box
            component={PinIconFilled}
            sx={styles.pinIcon}
          />
        )}
      </Box>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.tertiary}
        className="folder-more-btn"
        startIcon={<MoreVertIcon />}
        onClick={handleMenuClick}
        sx={styles.moreButton}
      />
    </Box>
  );
});

FolderItem.displayName = 'FolderItem';

/** @type {MuiSx} */
const folderItemStyles = isSelected => ({
  container: ({ palette }) => {
    const isDark = palette.mode === 'dark';
    const folder = palette.background.folder;

    const base = {
      display: 'flex',
      alignItems: 'center',
      height: '2.5rem',
      gap: '0.75rem',
      padding: '0.625rem 0.5rem 0.625rem 1rem',
      borderRadius: '0.625rem',
      boxSizing: 'border-box',
      cursor: 'pointer',
      position: 'relative',
      '& .folder-more-btn': {
        opacity: 0,
      },
      '&:hover .folder-more-btn': {
        opacity: 1,
      },
    };

    if (isDark) {
      if (isSelected) {
        return {
          ...base,
          backgroundColor: folder.active,
          border: `0.0625rem solid ${folder.borderActive}`,
        };
      }
      return {
        ...base,
        backgroundColor: folder.default,
        border: '0.0625rem solid transparent',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: '0.0625rem',
          background: folder.borderGradient,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        },
        '&:hover': {
          border: `0.0625rem solid ${folder.borderHover}`,
          '&::before': {
            display: 'none',
          },
        },
        '&:hover .folder-more-btn': {
          opacity: 1,
        },
      };
    }

    if (isSelected) {
      return {
        ...base,
        backgroundColor: folder.active,
        outline: `0.0625rem solid ${folder.borderActive}`,
        outlineOffset: '-0.0625rem',
        filter: `drop-shadow(${folder.shadow})`,
      };
    }
    return {
      ...base,
      backgroundColor: folder.default,
      filter: `drop-shadow(${folder.shadow})`,
      '&:hover': {
        outline: `0.0625rem solid ${folder.borderHover}`,
        outlineOffset: '-0.0625rem',
      },
      '&:hover .folder-more-btn': {
        opacity: 1,
      },
    };
  },
  icon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
    color: palette.icon.fill.default,
    flexShrink: 0,
  }),
  nameGroup: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  name: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
    minWidth: 0,
  }),
  count: ({ palette }) => ({
    color: palette.text.primary,
    flexShrink: 0,
    marginLeft: '0.25rem',
  }),
  pinIcon: ({ palette }) => ({
    width: '0.75rem',
    height: '0.75rem',
    color: palette.background.button.primary.disabled,
    flexShrink: 0,
    marginLeft: '0.25rem',
  }),
  moreButton: {
    '&.MuiButtonBase-root': {
      width: '1.75rem',
      height: '1.75rem',
      minWidth: '1.75rem',
      padding: 0,
    },
    flexShrink: 0,
    marginLeft: 'auto',
    '& .MuiButton-startIcon': {
      margin: 0,
    },
  },
  moreIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    color: palette.icon.fill.default,
  }),
});

export default FolderItem;
