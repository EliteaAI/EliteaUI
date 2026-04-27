import { useCallback, useState } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import UnifiedDropdown from '@/components/UnifiedDropdown';
import { useTheme } from '@emotion/react';

const ParticipantsAccordion = ({
  title,
  children,
  collapsed = false,
  onAdd,
  addTooltip,
  defaultExpanded = true,
  disabledAdd = false,
  // Dropdown specific props
  showDropdown = false,
  dropdownItems = [],
  onDropdownItemSelect,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  onCreateNew,
  createNewLabel = 'Create new',
  showCreateNew = false,
  isDropdownLoading = false,
  emptyMessage = 'No items found',
  noResultsMessage = 'No items found',
  canAddMore = true,
  // New: custom add icon component for header action (defaults to PlusIcon)
  addIcon: AddIconComponent = PlusIcon,
  onRefresh,
  onLoadMore,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [dropdownAnchor, setDropdownAnchor] = useState(null);
  const theme = useTheme();

  const handleToggle = useCallback(() => {
    if (!collapsed) {
      setExpanded(!expanded);
    }
  }, [collapsed, expanded]);

  const handleAddClick = useCallback(
    e => {
      e.stopPropagation();
      if (showDropdown) {
        // Open dropdown
        setDropdownAnchor(e.currentTarget);
      } else if (onAdd && !disabledAdd) {
        // Execute traditional onAdd callback
        onAdd();
      }
    },
    [showDropdown, onAdd, disabledAdd],
  );

  const handleDropdownClose = useCallback(() => {
    setDropdownAnchor(null);
  }, []);

  const handleDropdownItemClick = useCallback(
    item => {
      if (onDropdownItemSelect) {
        onDropdownItemSelect(item);
      }
      setDropdownAnchor(null);
    },
    [onDropdownItemSelect],
  );

  const handleCreateNew = useCallback(() => {
    if (onCreateNew) {
      onCreateNew();
    }
    setDropdownAnchor(null);
  }, [onCreateNew]);

  const handleRefresh = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();
      if (onRefresh) {
        onRefresh();
      }
    },
    [onRefresh],
  );

  // Expanded view - show full accordion
  return (
    <Box sx={{ width: '100%', marginBottom: '8px' }}>
      {/* Accordion Header */}
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 8px',
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '4px',
          },
        }}
      >
        <ArrowDownIcon
          width={16}
          height={16}
          fill={theme.palette.icon.main}
          style={{
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease-in-out',
          }}
        />
        <Box
          display={'flex'}
          alignItems={'center'}
          flexGrow={1}
          gap="6px"
        >
          <Typography
            variant="labelSmall"
            color="text.default"
            sx={{
              textTransform: 'capitalize',
            }}
          >
            {title}
          </Typography>
          {onRefresh && (
            <Tooltip
              title={`Refresh the ${title.toLowerCase()}`}
              placement="top"
            >
              <IconButton
                variant="alita"
                color="tertiary"
                onClick={handleRefresh}
                sx={{}}
              >
                <RefreshIcon
                  width={12}
                  height={12}
                />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {(onAdd || showDropdown) && canAddMore && (
          <StyledTooltip
            title={addTooltip || `Add ${title}`}
            placement="top"
          >
            <IconButton
              size="small"
              onClick={handleAddClick}
              disabled={disabledAdd}
              sx={({ palette }) => ({
                padding: '0.375rem',
                '&:hover': {
                  background: palette.background.tabButton.hover,
                  '& > *': { color: palette.icon.fill.secondary },
                  '& svg': { fill: palette.icon.fill.secondary },
                },
              })}
            >
              <Box
                width={16}
                height={16}
                sx={{
                  color: theme.palette.icon.fill.default,
                }}
              >
                <AddIconComponent
                  width={16}
                  height={16}
                  fill={disabledAdd ? theme.palette.icon.fill.disabled : theme.palette.icon.fill.default}
                />
              </Box>
            </IconButton>
          </StyledTooltip>
        )}
      </Box>

      {/* Accordion Content */}
      {expanded && (
        <Box
          sx={{
            paddingLeft: '8px',
            paddingRight: '8px',
            paddingTop: '4px',
          }}
        >
          {children}
        </Box>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <UnifiedDropdown
          anchorEl={dropdownAnchor}
          open={Boolean(dropdownAnchor)}
          onClose={handleDropdownClose}
          items={dropdownItems.map(item => ({
            ...item,
            onClick: () => handleDropdownItemClick(item),
          }))}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          onCreateNew={showCreateNew ? handleCreateNew : undefined}
          createNewLabel={createNewLabel}
          showCreateNew={showCreateNew}
          isLoading={isDropdownLoading}
          emptyMessage={emptyMessage}
          noResultsMessage={noResultsMessage}
          autoFocus={true}
          showDivider={true}
          onScroll={onLoadMore}
          showPublicLabel
        />
      )}
    </Box>
  );
};

export default ParticipantsAccordion;
