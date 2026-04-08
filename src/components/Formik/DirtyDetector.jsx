import { useEffect } from 'react';

import { useFormikContext } from 'formik';

import { useFormDirtyExcluding } from '@/[fsd]/shared/lib/hooks';

export default function DirtyDetector({ setDirty, excludeFields = ['is_pinned'] }) {
  const { dirty: rawDirty } = useFormikContext();
  const dirtyExcludingFields = useFormDirtyExcluding(excludeFields);

  const dirty = excludeFields.length === 0 ? rawDirty : dirtyExcludingFields;

  useEffect(() => {
    setDirty(dirty);
  }, [dirty, setDirty]);
  return null;
}
