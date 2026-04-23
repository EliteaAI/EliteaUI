import { memo } from 'react';

import { Box, ToggleButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';

const TabButtonItem = memo(props => {
  const { item, borderRadius, customSx, theme, disableTooltip } = props;
  const styles = tabButtonItemStyle(item);

  const button = (
    <ToggleButton
      variant="elitea"
      value={item.value}
      sx={{ ...styles.toggleButton, borderRadius, ...customSx }}
    >
      {item.label && (
        <Typography
          variant="labelSmall"
          sx={styles.toggleLabel}
        >
          {item.label}
        </Typography>
      )}
      {item.icon && (typeof item.icon === 'function' ? item.icon(theme) : item.icon)}
    </ToggleButton>
  );

  if (disableTooltip) {
    return button;
  }

  return (
    <Tooltip
      title={item.tooltip || item.label || item.value}
      placement="top"
    >
      <Box
        component="span"
        sx={{ display: 'inline-flex' }}
      >
        {button}
      </Box>
    </Tooltip>
  );
});

TabButtonItem.displayName = 'TabButtonItem';

/** @type {MuiSx} */
const tabButtonItemStyle = item => ({
  toggleButton: {
    ...(item.label ? { padding: '0.375rem 1rem' } : {}),
  },
  toggleLabel: { ml: item.icon ? 0.5 : 0 },
});

export default TabButtonItem;
