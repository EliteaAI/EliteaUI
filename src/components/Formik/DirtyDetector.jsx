import { useEffect } from 'react';

import { useFormikContext } from 'formik';

import { useFormDirtyExcluding } from '@/[fsd]/shared/lib/hooks';

export default function DirtyDetector(
  { isFormikContext = true, setDirty, excludeFields = ['is_pinned'] } = {
    isFormikContext: true,
    excludeFields: ['is_pinned'],
  },
) {
  const { dirty: rawDirty } = useFormikContext();
  const dirtyExcludingFields = useFormDirtyExcluding(excludeFields);

  const dirty = excludeFields.length === 0 ? rawDirty : dirtyExcludingFields;

  useEffect(() => {
    if (isFormikContext) {
      setDirty(dirty);
    }
  }, [dirty, setDirty, isFormikContext]);
  return null;
}
