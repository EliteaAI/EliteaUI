import { memo, useCallback, useMemo } from 'react';

import * as OwnerConsentHelpers from '@/[fsd]/features/owner-consent/lib/helpers/ownerConsent.helpers';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

// The delegated credentials a token consent names (C-1009, #7337): a multi-select, nothing picked by default
const ConsentCredentialPicker = memo(props => {
  const { candidates = [], picked, onChange, testId = 'consent-credentials' } = props;
  const options = useMemo(
    () => candidates.map(item => ({ label: item.title, value: OwnerConsentHelpers.credentialKey(item) })),
    [candidates],
  );
  const handleChange = useCallback(event => onChange(event.target.value || []), [onChange]);

  return (
    <SingleSelect
      data-testid={testId}
      showBorder
      multiple
      label={OwnerConsentHelpers.CREDENTIALS_LABEL}
      value={picked}
      onChange={handleChange}
      options={options}
      showOptionIcon={false}
    />
  );
});

ConsentCredentialPicker.displayName = 'ConsentCredentialPicker';

export default ConsentCredentialPicker;
