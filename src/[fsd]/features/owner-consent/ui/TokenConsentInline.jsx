import { memo, useCallback, useState } from 'react';

import {
  useGetOwnerConsentStatusQuery,
  useTokenConsentActionMutation,
} from '@/[fsd]/features/owner-consent/api/ownerConsentApi';
import * as OwnerConsentConstants from '@/[fsd]/features/owner-consent/lib/constants/ownerConsent.constants';
import * as OwnerConsentHelpers from '@/[fsd]/features/owner-consent/lib/helpers/ownerConsent.helpers';
import { useOwnerConsentAction } from '@/[fsd]/features/owner-consent/lib/hooks';

import ConsentCredentialPicker from './ConsentCredentialPicker';
import OwnerConsentInline from './OwnerConsentInline';

// The token list's consent line of one token, only where the platform allows it: the credentials a consent covers
// with Withdraw; for a restricted live token without one, Give consent with the credentials to name
const TokenConsentInline = memo(props => {
  const { token } = props;
  const { data: status } = useGetOwnerConsentStatusQuery();
  const consent = status?.consents?.[String(token?.id)];
  const canConsent = Boolean(status?.allowed && status?.linked && OwnerConsentHelpers.tokenCanConsent(token));
  const [choosing, setChoosing] = useState(false);
  const [picked, setPicked] = useState([]);
  const { data: offered } = useGetOwnerConsentStatusQuery(
    { projects: token?.scope_projects },
    { skip: !choosing || !canConsent || Boolean(consent) },
  );
  const [mutate, { isLoading }] = useTokenConsentActionMutation();
  const act = useOwnerConsentAction(mutate, OwnerConsentHelpers.consentActionText);
  const candidates = offered?.candidates;
  const onConsent = useCallback(async () => {
    if (!choosing) {
      setChoosing(true);
      return;
    }
    const credentials = OwnerConsentHelpers.pickedCredentials(candidates, picked);
    if (await act({ tokenId: token.id, action: 'consent', credentials })) {
      setChoosing(false);
      setPicked([]);
    }
  }, [act, candidates, choosing, picked, token?.id]);
  const onWithdraw = useCallback(() => act({ tokenId: token.id, action: 'withdraw' }), [act, token?.id]);

  if (!status?.allowed || (!consent && !canConsent)) return null;
  return (
    <OwnerConsentInline
      consented={Boolean(consent)}
      givenText={consent ? OwnerConsentHelpers.coveredText(consent.credentials) : undefined}
      isBusy={isLoading}
      actionDisabled={choosing && !picked.length}
      onConsent={onConsent}
      onWithdraw={onWithdraw}
      testId="token-consent"
    >
      {!consent &&
        choosing &&
        candidates?.length === 0 &&
        OwnerConsentConstants.NO_DELEGATED_CREDENTIALS_TEXT}
      {!consent && choosing && candidates?.length > 0 && (
        <ConsentCredentialPicker
          candidates={candidates}
          picked={picked}
          onChange={setPicked}
          testId="token-consent-credentials"
        />
      )}
    </OwnerConsentInline>
  );
});

TokenConsentInline.displayName = 'TokenConsentInline';

export default TokenConsentInline;
