import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { SectionStatusConstants } from '@/[fsd]/features/toolkits/lib/constants';
import ErrorIcon from '@/assets/error-icon.svg?react';
import FailIcon from '@/assets/fail-icon.svg?react';

const { SECTION_STATUS } = SectionStatusConstants;

const STATUS_ICONS = {
  [SECTION_STATUS.error]: ErrorIcon,
  [SECTION_STATUS.warning]: FailIcon,
};

const SectionStatusIcon = memo(props => {
  const { status, message, testId } = props;

  const Icon = STATUS_ICONS[status];
  const styles = sectionStatusIconStyles(status);

  if (!Icon) return null;

  return (
    <Tooltip
      title={message}
      placement="top"
    >
      <Box
        component="span"
        sx={styles.root}
        role="img"
        aria-label={message}
        data-testid={testId}
      >
        <Icon
          width={16}
          height={16}
        />
      </Box>
    </Tooltip>
  );
});

SectionStatusIcon.displayName = 'SectionStatusIcon';

/** @type {MuiSx} */
const sectionStatusIconStyles = status => ({
  root: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    color: palette.icon.indexResult[status],
  }),
});

export default SectionStatusIcon;
