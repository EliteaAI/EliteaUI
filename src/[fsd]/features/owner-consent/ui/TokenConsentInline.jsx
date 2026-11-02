import { memo, useCallback } from 'react';

import {
  useGetOwnerConsentStatusQuery,
  useTokenConsentActionMutation,
} from '@/[fsd]/features/owner-consent/api/ownerConsentApi';
import * as OwnerConsentHelpers from '@/[fsd]/features/owner-consent/lib/helpers/ownerConsent.helpers';
import { OWNER_CONSENT_TEXT, useOwnerConsentAction } from '@/[fsd]/features/owner-consent/lib/hooks';

import OwnerConsentInline from './OwnerConsentInline';

// The token list's consent line of one token: only where the platform allows it, for a restricted live token
const TokenConsentInline = memo(props => {
  const { token } = props;
  const { data: status } = useGetOwnerConsentStatusQuery();
  const [mutate, { isLoading }] = useTokenConsentActionMutation();
  const act = useOwnerConsentAction(mutate, OWNER_CONSENT_TEXT);
  const consented = Boolean(status?.consents?.[String(token?.id)]);
  const onConsent = useCallback(() => act({ tokenId: token.id, action: 'consent' }), [act, token?.id]);
  const onWithdraw = useCallback(() => act({ tokenId: token.id, action: 'withdraw' }), [act, token?.id]);

  if (!status?.allowed || (!consented && (!status.linked || !OwnerConsentHelpers.tokenCanConsent(token))))
    return null;
  return (
    <OwnerConsentInline
      consented={consented}
      isBusy={isLoading}
      onConsent={onConsent}
      onWithdraw={onWithdraw}
      testId="token-consent"
    />
  );
});

TokenConsentInline.displayName = 'TokenConsentInline';

export default TokenConsentInline;
