import { useCallback } from 'react';

import { useToast } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage } from '@/common/utils';

// Runs a consent mutation and says the outcome in a toast: the server's own text on a refusal
export const useOwnerConsentAction = (mutate, successText) => {
  const { toastSuccess, toastError } = useToast();
  return useCallback(
    async args => {
      const { error } = await mutate(args);
      if (error) {
        toastError(buildErrorMessage(error));
        return false;
      }
      toastSuccess(successText(args));
      return true;
    },
    [mutate, successText, toastSuccess, toastError],
  );
};

const consentText = ({ action }) =>
  action === 'consent' || action === undefined ? 'Consent given' : 'Consent withdrawn';

export const OWNER_CONSENT_TEXT = consentText;
