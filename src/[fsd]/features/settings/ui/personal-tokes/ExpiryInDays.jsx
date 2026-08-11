import { memo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { Text } from '@/[fsd]/shared/ui';
import { calculateExpiryInDays } from '@/common/utils';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import RemoveIcon from '@/components/Icons/RemoveIcon';
import SuccessIcon from '@/components/Icons/SuccessIcon';

const ExpiryInDays = memo(props => {
  const { expires } = props;
  const theme = useTheme();
  const styles = expiryInDaysStyles();
  const expiryInDays = calculateExpiryInDays(expires);

  if (expiryInDays > 7) {
    return (
      <Box
        data-testid="token-expiration-status"
        data-expiration-state="active"
        sx={styles.container}
      >
        <SuccessIcon
          width={16}
          height={16}
          fill={theme.palette.status.published}
        />
        <Text.EllipsisTypography
          sx={styles.text}
          color="text.secondary"
          variant="bodySmall"
        >
          {`in ${expiryInDays} days`}
        </Text.EllipsisTypography>
      </Box>
    );
  }

  if (expiryInDays > 0) {
    return (
      <Box
        data-testid="token-expiration-status"
        data-expiration-state="warning"
        sx={styles.container}
      >
        <AttentionIcon
          width={16}
          height={16}
          fill={theme.palette.status.onModeration}
        />
        <Text.EllipsisTypography
          sx={styles.text}
          color="text.secondary"
          variant="bodyMedium"
        >
          {`in ${expiryInDays} days`}
        </Text.EllipsisTypography>
      </Box>
    );
  }

  if (expiryInDays === -1) {
    return (
      <Box
        data-testid="token-expiration-status"
        data-expiration-state="never"
        sx={styles.container}
      >
        <SuccessIcon
          width={16}
          height={16}
          fill={theme.palette.status.published}
        />
        <Text.EllipsisTypography
          sx={styles.textNever}
          color="text.secondary"
          variant="bodyMedium"
        >
          Never
        </Text.EllipsisTypography>
      </Box>
    );
  }

  return (
    <Box
      data-testid="token-expiration-status"
      data-expiration-state="expired"
      sx={styles.container}
    >
      <RemoveIcon
        width={16}
        height={16}
        fill={theme.palette.icon.fill.disabled}
      />
      <Typography
        sx={styles.textNever}
        color="text.primary"
        variant="bodyMedium"
      >
        Expired
      </Typography>
    </Box>
  );
});

ExpiryInDays.displayName = 'ExpiryInDays';

/** @type {MuiSx} */
const expiryInDaysStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    minHeight: '100%',
    width: '100%',
    gap: '0.5rem',
    boxSizing: 'border-box',
  },
  text: {
    width: 'calc(100% - 1.5rem)',
  },
  textNever: {
    lineHeight: '100%',
    width: 'calc(100% - 1.5rem)',
  },
});

export default ExpiryInDays;
