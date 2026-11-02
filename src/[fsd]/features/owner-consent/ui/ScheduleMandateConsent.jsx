import { memo, useCallback } from 'react';

import {
  useGetMyMandatesQuery,
  useGetOwnerConsentStatusQuery,
  useMandateConsentActionMutation,
} from '@/[fsd]/features/owner-consent/api/ownerConsentApi';
import * as OwnerConsentHelpers from '@/[fsd]/features/owner-consent/lib/helpers/ownerConsent.helpers';
import { OWNER_CONSENT_TEXT, useOwnerConsentAction } from '@/[fsd]/features/owner-consent/lib/hooks';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

import OwnerConsentInline from './OwnerConsentInline';

// The schedule card's consent line for its owner: when the owner's mandate for the schedule's version acts with
// their Microsoft sign-in (C-1009, #7131/#7337). Nothing is asked of a schedule that is not the viewer's own
const ScheduleMandateConsent = memo(props => {
  const { versionId, isOwner } = props;
  const projectId = useSelectedProjectId();
  const { data: status } = useGetOwnerConsentStatusQuery(undefined, { skip: !isOwner });
  const { data: mine } = useGetMyMandatesQuery(
    { projectId },
    { skip: !isOwner || !projectId || !status?.mandates },
  );
  const [mutate, { isLoading }] = useMandateConsentActionMutation();
  const act = useOwnerConsentAction(mutate, OWNER_CONSENT_TEXT);
  const mandate = OwnerConsentHelpers.mandateForVersion(mine?.rows, versionId);
  const onConsent = useCallback(
    () => act({ projectId, mandateId: mandate?.id, action: 'consent' }),
    [act, projectId, mandate?.id],
  );
  const onWithdraw = useCallback(
    () => act({ projectId, mandateId: mandate?.id, action: 'withdraw_consent' }),
    [act, projectId, mandate?.id],
  );

  if (!isOwner || !status?.mandates || !mandate) return null;
  return (
    <OwnerConsentInline
      consented={Boolean(mandate.consented)}
      isBusy={isLoading}
      onConsent={onConsent}
      onWithdraw={onWithdraw}
      testId="schedule-mandate-consent"
    />
  );
});

ScheduleMandateConsent.displayName = 'ScheduleMandateConsent';

export default ScheduleMandateConsent;
