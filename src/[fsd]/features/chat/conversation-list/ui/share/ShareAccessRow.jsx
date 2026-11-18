import { memo, useCallback } from 'react';

import { Avatar, Box, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import CloseIcon from '@/components/Icons/CloseIcon';
import UsersIcon from '@/components/Icons/UsersIcon';
import UserAvatar from '@/components/UserAvatar';

import { WHOLE_TEAM_ID } from '../../lib/constants/shareChat.constants';

const ShareAccessRow = memo(props => {
  const {
    item,
    isOwner = false,
    removable = false,
    onRemove,
    testId = 'share-access-row',
    selected,
    wholeTeamName,
    onSelect,
  } = props;

  const handleRemove = useCallback(() => onRemove?.(item.id), [item.id, onRemove]);
  const handleSelect = useCallback(() => onSelect?.(item), [item, onSelect]);
  const isWholeTeam = item.id === WHOLE_TEAM_ID;
  const name = isWholeTeam ? wholeTeamName : item.name;

  const styles = shareAccessRowStyles(!!onSelect, selected);

  return (
    <Box
      data-testid={testId}
      aria-selected={onSelect ? !!selected : undefined}
      role={onSelect ? 'option' : undefined}
      sx={styles.root}
      onClick={onSelect ? handleSelect : undefined}
    >
      {isWholeTeam ? (
        <Avatar sx={styles.teamAvatar}>
          <UsersIcon sx={styles.teamIcon} />
        </Avatar>
      ) : (
        <UserAvatar
          name={name}
          avatar={item.avatar}
          size={20}
        />
      )}
      <TypographyWithConditionalTooltip
        title={name}
        placement="top"
        variant="bodyMedium"
        color="text.secondary"
        noWrap
        sx={styles.name}
      >
        {name}
      </TypographyWithConditionalTooltip>
      {isOwner && (
        <Typography
          variant="bodySmall"
          sx={styles.ownerBadge}
        >
          Owner
        </Typography>
      )}
      {removable && !isOwner && (
        <Box
          className="share-row-remove"
          sx={styles.removeSlot}
        >
          <Tooltip title="Remove access">
            <Button.BaseBtn
              data-testid="share-remove-row"
              aria-label="Remove access"
              variant={BUTTON_VARIANTS.tertiary}
              size="small"
              startIcon={<CloseIcon sx={styles.removeIcon} />}
              onClick={handleRemove}
            />
          </Tooltip>
        </Box>
      )}
      {selected && (
        <Box sx={styles.check}>
          <CheckedIcon />
        </Box>
      )}
    </Box>
  );
});

ShareAccessRow.displayName = 'ShareAccessRow';

/** @type {MuiSx} */
const shareAccessRowStyles = (isOption, selected) => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    height: '2.5rem',
    padding: '0 1rem',
    cursor: isOption ? 'pointer' : 'default',
    backgroundColor: selected ? palette.background.selectedItem.default : 'transparent',
    '&:hover': {
      backgroundColor: selected
        ? palette.background.selectedItem.hover
        : palette.background.interactiveItem.hover,
    },
    '& .share-row-remove': { visibility: 'hidden' },
    '&:hover .share-row-remove': { visibility: 'visible' },
  }),
  teamAvatar: ({ palette }) => ({
    width: '1.25rem',
    height: '1.25rem',
    fontSize: '0.625rem',
    backgroundColor: palette.primary.main,
    color: palette.primary.contrastText,
  }),
  teamIcon: {
    fontSize: '0.75rem',
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  ownerBadge: ({ palette }) => ({
    flexShrink: 0,
    padding: '0.125rem 0.375rem',
    borderRadius: '0.875rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    color: palette.text.metrics,
    textTransform: 'none',
  }),
  removeSlot: {
    display: 'flex',
  },
  removeIcon: {
    fontSize: '1rem',
  },
  check: ({ palette }) => ({
    display: 'flex',
    '& svg path': { fill: palette.icon.secondary },
  }),
});

export default ShareAccessRow;
