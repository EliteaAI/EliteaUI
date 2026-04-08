import { memo, useCallback } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import StyledSearchInput from '@/components/SearchInput';

const DrawerPageHeader = memo(props => {
  const {
    showBorder,
    sx,
    showBackButton,
    title,
    showSearchInput,
    showAddButton,
    extraContent,
    slotProps,
    onBack,
  } = props;
  const { search, onChangeSearch, placeholder = 'Search something amazing!' } = slotProps?.searchInput || {};
  const { onAdd, disabled, tooltip: addButtonTooltip } = slotProps?.addButton || {};
  const styles = getStyles();
  const handleInputChange = useCallback(
    event => {
      onChangeSearch(event.target.value);
    },
    [onChangeSearch],
  );

  return (
    <Box sx={[styles.container(showBorder), sx]}>
      <Box sx={styles.titleContainer}>
        {showBackButton && (
          <IconButton
            variant="elitea"
            color={'tertiary'}
            onClick={onBack}
            sx={styles.iconButton}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography
          variant="headingSmall"
          color="text.secondary"
          component={'div'}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={styles.body}>
        {showSearchInput && (
          <StyledSearchInput
            search={search}
            onChangeSearch={handleInputChange}
            placeholder={placeholder}
            sx={styles.searchInput}
          />
        )}
        {extraContent}
        {showAddButton && (
          <Tooltip
            title={addButtonTooltip}
            placement="top"
          >
            <Box component={'span'}>
              <IconButton
                disabled={!!disabled}
                disableRipple
                variant="elitea"
                color="primary"
                onClick={onAdd}
                sx={styles.addButton}
              >
                <PlusIcon style={styles.plusIcon} />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
});

DrawerPageHeader.displayName = 'DrawerPageHeader';

/**@type {MuiSx} */
const getStyles = () => ({
  container: showBorder => ({
    height: '3.8rem',
    minHeight: '3.8rem',
    width: '100%',
    borderBottom: ({ palette }) => (showBorder ? `0.0625rem solid ${palette.border.table}` : undefined),
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1.5rem',
  }),
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  body: {
    flex: 1,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  iconButton: ({ palette }) => ({
    margin: '0',
    '&:hover svg path': {
      fill: palette.icon.fill.secondary,
    },
  }),
  searchInput: {
    flexShrink: 0, // Allow input to shrink
    width: '15rem',
    height: '2.25rem',
    backgroundColor: ({ palette }) => palette.background.userInputBackgroundActive,
    borderRadius: '1.6875rem',
    gap: '.5rem',
    borderBottom: '0rem',
    padding: '0.375rem 0.75rem',
  },
  addButton: ({ palette }) => ({
    minWidth: '1.75rem',
    width: '1.75rem',
    height: '1.75rem',
    padding: '.5rem',
    '& svg': {
      fill: palette.icon.fill.send,
    },
  }),
  plusIcon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
});

export default DrawerPageHeader;
