import { memo } from 'react';

import { Typography } from '@mui/material';

import {
  SKILL_COMPARE_FILE_STATUS,
  SKILL_COMPARE_FILE_STATUS_LABELS,
} from '@/[fsd]/features/skill/lib/constants';

const STATUS_ALERT_TONES = {
  [SKILL_COMPARE_FILE_STATUS.changed]: 'warning',
  [SKILL_COMPARE_FILE_STATUS.new]: 'success',
  [SKILL_COMPARE_FILE_STATUS.removed]: 'error',
  [SKILL_COMPARE_FILE_STATUS.replaced]: 'warning',
};

const SkillCompareFileStatusChip = memo(props => {
  const { status } = props;
  const label = SKILL_COMPARE_FILE_STATUS_LABELS[status];
  const styles = skillCompareFileStatusChipStyles(STATUS_ALERT_TONES[status]);

  if (!label) return null;

  return (
    <Typography
      variant="labelSmall"
      sx={styles.chip}
      data-testid={`skill-compare-file-status-${status}`}
    >
      {label}
    </Typography>
  );
});

SkillCompareFileStatusChip.displayName = 'SkillCompareFileStatusChip';

/** @type {MuiSx} */
const skillCompareFileStatusChipStyles = tone => ({
  chip: ({ palette }) => ({
    flexShrink: 0,
    padding: '0.125rem 0.5rem',
    borderRadius: '1rem',
    textTransform: 'none',
    letterSpacing: 'normal',
    color: palette.alert[tone]?.text,
    backgroundColor: palette.alert[tone]?.background,
    border: `0.0625rem solid ${palette.alert[tone]?.border}`,
  }),
});

export default SkillCompareFileStatusChip;
