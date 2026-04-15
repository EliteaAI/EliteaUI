import { useEffect } from 'react';

import { useFormikContext } from 'formik';

/**
 * Syncs conversation starters from Formik values to the parent via callback.
 * Must be called inside a Formik context (e.g. BaseEditor content components).
 *
 * @param {Function|undefined} onConversationStartersChange
 */
export const useConversationStartersSync = onConversationStartersChange => {
  const { values } = useFormikContext();

  useEffect(() => {
    onConversationStartersChange?.(values?.version_details?.conversation_starters || []);
  }, [values?.version_details?.conversation_starters, onConversationStartersChange]);
};
