import { memo } from 'react';

import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { Badge, Box } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const getLabel = (open, count) => {
  if (open) return 'Hide filters';
  return count ? `Filters · ${count} on` : 'Show filters';
};

// The filter switch at the search field's right end: tertiary while closed, secondary while open
const FilterToggleButton = memo(props => {
  const { open = false, onToggle, count = 0, testId } = props;
  const label = getLabel(open, count);
  const styles = filterToggleButtonStyles();

  return (
    <StyledTooltip
      title={label}
      placement="top"
    >
      <Box
        component="span"
        sx={styles.wrapper}
      >
        <Button.BaseBtn
          variant={open ? BUTTON_VARIANTS.secondary : BUTTON_VARIANTS.tertiary}
          aria-label={label}
          aria-pressed={open}
          onClick={onToggle}
          data-testid={testId}
          startIcon={
            <Badge
              badgeContent={count}
              invisible={open || !count}
              sx={styles.badge}
            >
              <FilterAltOutlinedIcon sx={styles.icon} />
            </Badge>
          }
        />
      </Box>
    </StyledTooltip>
  );
});

FilterToggleButton.displayName = 'FilterToggleButton';

/** @type {MuiSx} */
const filterToggleButtonStyles = () => ({
  // The field's 0.75rem padding minus 0.5rem: the button sits 0.25rem from the field's edge
  wrapper: {
    display: 'flex',
    flexShrink: 0,
    marginRight: '-0.5rem',
  },
  icon: {
    width: '1rem',
    height: '1rem',
  },
  // A count in the primary button's colors on the icon's corner
  badge: ({ palette, typography }) => ({
    '& .MuiBadge-badge': {
      ...typography.labelSmall,
      fontSize: '0.625rem',
      lineHeight: '0.875rem',
      minWidth: '0.875rem',
      height: '0.875rem',
      padding: '0 0.25rem',
      transform: 'translate(65%, -45%)',
      color: palette.components.button.text.primary,
      backgroundColor: palette.components.button.background.primary.default,
    },
  }),
});

export default FilterToggleButton;
