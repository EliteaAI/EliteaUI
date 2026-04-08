import { useCallback } from 'react';

import { useFormikContext } from 'formik';

export default function useDiscardApplicationChanges(doOtherResets) {
  const { resetForm } = useFormikContext();
  const discardApplicationChanges = useCallback(() => {
    resetForm();
    doOtherResets?.();
  }, [doOtherResets, resetForm]);
  return { discardApplicationChanges };
}
