import { memo } from 'react';

import { Typography } from '@mui/material';

import { useGetOwnerConsentStatusQuery } from '@/[fsd]/features/owner-consent/api/ownerConsentApi';
import * as OwnerConsentHelpers from '@/[fsd]/features/owner-consent/lib/helpers/ownerConsent.helpers';

// The toolkit page's one line for a saved toolkit with a delegated Microsoft credential: its schedules and API tokens
// ask for the owner's consent (the toolkit itself holds none). Shown only where the platform allows either
const DelegatedConsentNote = memo(props => {
  const { show } = props;
  const { data: status } = useGetOwnerConsentStatusQuery(undefined, { skip: !show });
  if (!show || !(status?.allowed || status?.mandates)) return null;
  return (
    <Typography
      variant="bodySmall"
      sx={styles.note}
      data-testid="toolkit-delegated-consent-note"
    >
      {OwnerConsentHelpers.TOOLKIT_NOTE}
    </Typography>
  );
});

DelegatedConsentNote.displayName = 'DelegatedConsentNote';

/** @type {MuiSx} */
const styles = {
  note: ({ palette }) => ({
    color: palette.text.secondary,
  }),
};

export default DelegatedConsentNote;
