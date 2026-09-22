import { memo, useCallback, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import { CircularProgress, Menu, MenuItem, Typography } from '@mui/material';

import BreadcrumbItem from './BreadcrumbItem';

/**
 * A crumb that switches between sibling records instead of navigating up, the way GitHub's
 * repository crumb does. The label keeps the plain breadcrumb look — no chevron — and the caller
 * decides the order, so the record the current page came from can lead the list with a badge.
 */
const BreadcrumbMenuTrigger = memo(props => {
  const { label, testId, menu } = props;
  const {
    items = [],
    activeId = null,
    onSelect,
    header,
    emptyLabel = 'No items yet',
    isLoading = false,
  } = menu;

  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleSelect = useCallback(
    item => () => {
      setAnchorEl(null);
      onSelect?.(item);
    },
    [onSelect],
  );

  const styles = breadcrumbMenuTriggerStyles();

  return (
    <>
      <BreadcrumbItem
        label={label}
        testId={testId}
        onTriggerClick={handleOpen}
        isMenuOpen={!!anchorEl}
      />
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        sx={styles.menu}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        data-testid="breadcrumb-menu"
      >
        {!!header && (
          <Typography
            variant="labelSmall"
            sx={styles.header}
            data-testid="breadcrumb-menu-header"
          >
            {header}
          </Typography>
        )}
        {/* Only an answered, empty list means there is nothing to switch to — while the caller is
            still fetching, saying so would be wrong. */}
        {isLoading && (
          <MenuItem
            disabled
            sx={styles.item}
            data-testid="breadcrumb-menu-loading"
          >
            <CircularProgress size={16} />
          </MenuItem>
        )}
        {!isLoading && items.length === 0 && (
          <MenuItem
            disabled
            sx={styles.item}
          >
            <Typography variant="bodyMedium">{emptyLabel}</Typography>
          </MenuItem>
        )}
        {items.map(item => {
          const isActive = item.id === activeId;

          return (
            <MenuItem
              key={item.id}
              onClick={handleSelect(item)}
              sx={styles.item}
              data-testid={`breadcrumb-menu-item-${item.id}`}
              aria-current={isActive ? 'true' : undefined}
            >
              <Typography
                variant="bodyMedium"
                sx={styles.itemLabel}
              >
                {item.label}
              </Typography>
              {item.badge ? (
                <Typography
                  variant="labelSmall"
                  sx={styles.badge}
                >
                  {item.badge}
                </Typography>
              ) : (
                isActive && <CheckIcon sx={styles.checkIcon} />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
});

BreadcrumbMenuTrigger.displayName = 'BreadcrumbMenuTrigger';

/** @type {MuiSx} */
const breadcrumbMenuTriggerStyles = () => ({
  menu: ({ palette }) => ({
    '& .MuiPaper-root': {
      borderRadius: '0.5rem',
      border: `0.0625rem solid ${palette.border.lines}`,
      backgroundColor: palette.background.default.secondary,
      minWidth: '15rem',
      maxWidth: '20rem',
    },
    '& .MuiList-root': {
      padding: '0.5rem 0',
      maxHeight: '20rem',
      overflowY: 'auto',
    },
  }),
  header: ({ palette }) => ({
    display: 'block',
    padding: '0.5rem 1rem',
    color: palette.text.primary,
  }),
  item: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    minHeight: '2.5rem',
    padding: '0.5rem 1rem',
    color: palette.text.secondary,
    '&:hover': {
      backgroundColor: palette.background.surface.interactive.default,
    },
  }),
  itemLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: ({ palette }) => ({
    color: palette.text.info,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),
  checkIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.default,
    flexShrink: 0,
  }),
});

export default BreadcrumbMenuTrigger;
