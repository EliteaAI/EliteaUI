import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import * as OwnerConsentConstants from '@/[fsd]/features/owner-consent/lib/constants/ownerConsent.constants';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

// One consent line for every holder that runs without its owner (a scoped token, a schedule's mandate): the state
// in words and the owner's one action, Give consent or Withdraw
const OwnerConsentInline = memo(props => {
  const {
    consented,
    isBusy = false,
    onConsent,
    onWithdraw,
    testId = 'owner-consent',
    givenText,
    children,
    actionDisabled = false,
    sx,
  } = props;
  const styles = ownerConsentInlineStyles();

  return (
    <Box
      sx={[styles.root, sx]}
      data-testid={testId}
    >
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        {consented
          ? givenText || OwnerConsentConstants.CONSENT_GIVEN_TEXT
          : OwnerConsentConstants.CONSENT_NEEDED_TEXT}
      </Typography>
      {children}
      <Button.BaseBtn
        data-testid={`${testId}-${consented ? 'withdraw' : 'give'}`}
        variant={BUTTON_VARIANTS.tertiary}
        size="small"
        disabled={isBusy || actionDisabled}
        onClick={consented ? onWithdraw : onConsent}
      >
        {consented ? 'Withdraw' : 'Give consent'}
        {isBusy && (
          <CircularProgress
            size={12}
            sx={styles.progress}
          />
        )}
      </Button.BaseBtn>
    </Box>
  );
});

OwnerConsentInline.displayName = 'OwnerConsentInline';

/** @type {MuiSx} */
const ownerConsentInlineStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
    minWidth: 0,
  },
  text: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  progress: {
    ml: '0.25rem',
  },
});

export default OwnerConsentInline;
