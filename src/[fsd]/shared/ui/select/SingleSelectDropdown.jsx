import { memo } from 'react';

import { Box, ListSubheader, MenuItem, Typography } from '@mui/material';

import { FLAT_MENU_ACTION_VALUE } from '@/[fsd]/shared/lib/constants/singleSelectConstants';
import SimpleSearchBar from '@/[fsd]/shared/ui/input/SimpleSearchBar';
import PlusIcon from '@/assets/plus-icon.svg?react';

import SingleSelectMenuItem from './SingleSelectMenuItem';

const SingleSelectDropdown = memo(props => {
  const {
    isSearchBar,
    isMenuAction,
    searchQuery,
    onSearchChange,
    onSearchClear,
    searchPlaceholder,
    option,
    isSelected,
    onClear,
    customRenderOption,
    showOptionIcon = false,
    showOptionDescription = false,
    iconPosition = 'left',
    optionsWithAvatar = false,
    menuItemIconSX,
    onDeleteOption,
    optionTextColumnSx,
    sx: muiSx,
    onClick: muiOnClick,
    ...restProps
  } = props;

  const styles = selectMenuItemStyles();

  if (isSearchBar) {
    return (
      <ListSubheader sx={styles.searchBarHeader}>
        <SimpleSearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSearchClear={onSearchClear}
          placeholder={searchPlaceholder}
          sx={styles.searchBarInput}
          onKeyDown={e => e.stopPropagation()}
        />
      </ListSubheader>
    );
  }

  if (isMenuAction) {
    return (
      <MenuItem
        {...restProps}
        onClick={muiOnClick}
        value={FLAT_MENU_ACTION_VALUE}
        sx={styles.menuActionItem}
      >
        <Box sx={styles.menuActionRow}>
          <PlusIcon
            aria-hidden
            style={{ flexShrink: 0 }}
          />
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            Action
          </Typography>
        </Box>
      </MenuItem>
    );
  }

  return (
    <SingleSelectMenuItem
      {...restProps}
      sx={muiSx}
      onClick={muiOnClick}
      option={option}
      isSelected={isSelected}
      onClear={onClear}
      customRenderOption={customRenderOption}
      showOptionIcon={showOptionIcon}
      showOptionDescription={showOptionDescription}
      iconPosition={iconPosition}
      optionsWithAvatar={optionsWithAvatar}
      menuItemIconSX={menuItemIconSX}
      onDeleteOption={onDeleteOption}
      optionTextColumnSx={optionTextColumnSx}
    />
  );
});

const selectMenuItemStyles = () => ({
  searchBarHeader: ({ palette }) => ({
    padding: 0,
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: palette.background.secondary,
  }),
  searchBarInput: ({ palette }) => ({
    borderRadius: 0,
    border: 'none',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: 'transparent',
    padding: '0.75rem 1rem',
    height: 'auto',
    '&:focus-within': {
      backgroundColor: 'transparent',
      borderColor: palette.border.lines,
    },
  }),
  menuActionItem: ({ palette }) => ({
    justifyContent: 'flex-start',
    padding: '0.5rem 1rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    color: palette.icon.main,
    '&:hover': {
      backgroundColor: palette.background.select.hover,
    },
  }),
  menuActionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
  },
});

SingleSelectDropdown.displayName = 'SingleSelectDropdown';

export default SingleSelectDropdown;
