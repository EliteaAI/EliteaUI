import { Box, Typography } from '@mui/material';

import { EntityTypeIcon } from '@/components/EntityIcon';

/**
 * Shared option-body renderer for participant autocomplete dropdowns.
 * Renders: type icon + participant name.
 * Optionally renders a right-aligned muted type label when `getTypeLabel` is provided.
 */
// eslint-disable-next-line react/display-name
export const makeRenderOptionBody = (styles, getTypeLabel) => option => (
  <Box sx={styles.optionBody}>
    <EntityTypeIcon
      type={option.entity_name}
      specifiedFontSize="1rem"
    />
    <Typography
      variant="bodyMedium"
      color="text.secondary"
      sx={styles.optionName}
    >
      {option.name}
    </Typography>
    {getTypeLabel && (
      <Typography
        variant="bodySmall"
        color="text.secondary"
        sx={styles.optionTypeLabel}
      >
        {getTypeLabel(option)}
      </Typography>
    )}
  </Box>
);

/**
 * Shared chip-label renderer for participant autocomplete dropdowns.
 * Renders: type icon + participant name.
 */
// eslint-disable-next-line react/display-name
export const makeRenderChipLabel = styles => option => (
  <Box sx={styles.chipLabel}>
    <EntityTypeIcon
      type={option.entity_name}
      specifiedFontSize="0.75rem"
    />
    <Typography
      variant="bodySmall"
      color="text.secondary"
    >
      {option.name}
    </Typography>
  </Box>
);

/** Shared base styles for participant option / chip rendering. */
export const participantRenderBaseStyles = {
  optionBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    minWidth: 0,
  },
  optionName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  optionTypeLabel: {
    flexShrink: 0,
    marginRight: '0.5rem',
  },
  chipLabel: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    gap: '0.25rem',
  },
};
