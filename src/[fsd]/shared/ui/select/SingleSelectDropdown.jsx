import { memo } from 'react';

import { Box, ListItemIcon, ListSubheader, MenuItem, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import SimpleSearchBar from '@/[fsd]/shared/ui/input/SimpleSearchBar';
import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import RemoveIcon from '@/assets/remove-icon.svg?react';

const SingleSelectDropdown = memo(props => {
  const {
    isSearchBar,
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
    sx: muiSx,
    onClick: muiOnClick,
    ...restProps
  } = props;

  const styles = selectMenuItemStyles();
  const theme = useTheme();
  const selectedBackground = isSelected ? theme.palette.background.participant.active : undefined;

  const handleClick = event => {
    if (isSelected && onClear) {
      onClear(event);
    }
    if (muiOnClick) {
      muiOnClick(event);
    }
  };

  const renderIcon = position => {
    if (iconPosition !== position) return null;

    const rightSx = position === 'right' ? { marginRight: '0rem', marginLeft: '0.5rem' } : {};

    const iconSx = optionsWithAvatar
      ? [styles.menuItemIconWithAvatar, rightSx]
      : [styles.menuItemIcon, menuItemIconSX, rightSx];

    return <ListItemIcon sx={iconSx}>{option.icon}</ListItemIcon>;
  };

  const renderTextBlock = () => {
    const primaryLabel = showOptionIcon
      ? `${option.label}${option.date ? ' - ' + option.date : ''}`
      : option.label;
    const fullTitle = `${primaryLabel}${option.description ? ' — ' + option.description : ''}`;

    if (!showOptionDescription) {
      return (
        <TypographyWithConditionalTooltip
          title={primaryLabel}
          placement="top"
          variant="labelMedium"
          color="text.secondary"
          sx={styles.optionLabel}
        >
          {primaryLabel}
        </TypographyWithConditionalTooltip>
      );
    }

    return (
      <Box
        sx={styles.optionTextColumn}
        title={fullTitle}
      >
        <TypographyWithConditionalTooltip
          title={primaryLabel}
          placement="top"
          variant="labelMedium"
          color="text.secondary"
          sx={styles.optionLabelPrimaryWithDescription}
        >
          {primaryLabel}
        </TypographyWithConditionalTooltip>
        {option?.description && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={styles.optionDescriptionLine}
          >
            {option.description}
          </Typography>
        )}
      </Box>
    );
  };

  const renderContent = () => {
    if (customRenderOption) return customRenderOption(option, isSelected);

    if (showOptionIcon) {
      return (
        <Box sx={[styles.iconContainer, showOptionDescription && styles.iconContainerWithDescription]}>
          {renderIcon('left')}
          {renderTextBlock()}
          {renderIcon('right')}
        </Box>
      );
    }

    return renderTextBlock();
  };

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

  return (
    <MenuItem
      {...restProps}
      sx={[
        muiSx,
        styles.menuItem,
        selectedBackground && { background: `${selectedBackground} !important` },
        option.style,
      ]}
      onClick={handleClick}
    >
      {renderContent()}
      {option.canDelete && onDeleteOption ? (
        <ListItemIcon
          sx={[styles.menuItemIcon, styles.menuItemSelectedIcon, styles.deleteIcon]}
          onClick={e => {
            e.stopPropagation();
            onDeleteOption(option.value);
          }}
        >
          <RemoveIcon />
        </ListItemIcon>
      ) : (
        isSelected && (
          <ListItemIcon sx={[styles.menuItemIcon, styles.menuItemSelectedIcon]}>
            <CheckedIcon />
          </ListItemIcon>
        )
      )}
    </MenuItem>
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
    padding: '0.75rem 1.25rem',
    height: 'auto',
    '&:focus-within': {
      backgroundColor: 'transparent',
      borderColor: palette.border.lines,
    },
  }),
  menuItem: {
    justifyContent: 'space-between',
    alignItems: 'center',
    '&:hover #show-on-hover': {
      display: 'flex',
    },
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  iconContainerWithDescription: {
    alignItems: 'flex-start',
  },
  optionTextColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
    maxWidth: 'inherit',
  },
  optionLabel: {
    whiteSpaceCollapse: 'preserve',
    maxWidth: 'inherit',
    width: '100%',
  },
  optionLabelPrimaryWithDescription: {
    whiteSpaceCollapse: 'preserve',
    maxWidth: '100%',
    width: '100%',
  },
  optionDescriptionLine: {
    whiteSpaceCollapse: 'preserve',
    maxWidth: '100%',
  },
  menuItemIconWithAvatar: {
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
    marginRight: '0.5rem',
    minWidth: '1rem !important',
    '& svg': {
      fontSize: '1rem',
      color: 'text.secondary',
    },
  },
  menuItemIcon: {
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
    marginRight: '0.6rem',
    minWidth: '1rem !important',
    '& svg': {
      fontSize: '1rem',
      color: 'text.secondary',
    },
  },
  menuItemSelectedIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '0rem',
    marginLeft: '1rem',
  },
  deleteIcon: {
    cursor: 'pointer',
  },
});

SingleSelectDropdown.displayName = 'SingleSelectDropdown';

export default SingleSelectDropdown;
