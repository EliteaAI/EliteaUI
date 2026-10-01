import { memo } from 'react';

import { Chip, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';

const EntityKindChip = memo(props => {
  const { kind } = props;

  const label = AnalyticsCommonConstants.ENTITY_KIND_LABELS[kind];

  const styles = entityKindChipStyles();

  if (!label) return <Typography sx={styles.empty}>—</Typography>;

  return (
    <Chip
      size="small"
      label={label}
      sx={styles.chip}
    />
  );
});

EntityKindChip.displayName = 'EntityKindChip';

/** @type {MuiSx} */
const entityKindChipStyles = () => ({
  chip: ({ palette }) => ({
    height: '1.25rem',
    fontSize: '0.6875rem',
    color: palette.text.secondary,
    backgroundColor: palette.background.default.secondary || 'transparent',
  }),
  empty: { fontSize: '0.8125rem' },
});

export default EntityKindChip;
