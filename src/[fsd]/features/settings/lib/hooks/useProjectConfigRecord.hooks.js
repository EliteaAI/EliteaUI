import { useCallback, useState } from 'react';

import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import {
  useCreateConfigurationMutation,
  useGetConfigurationsListQuery,
  useUpdateConfigurationMutation,
} from '@/api/configurations';

export const useProjectConfigRecord = ({ type, label, errorMessage, onSaved }) => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { data, refetch: refreshRecord } = useGetConfigurationsListQuery(
    { projectId, type, includeShared: false },
    { skip: !projectId },
  );
  const [create] = useCreateConfigurationMutation();
  const [update] = useUpdateConfigurationMutation();
  const [saving, setSaving] = useState(false);
  const record = data?.items?.find(item => item.elitea_title === type);

  // Saving stays true until the saved row is re-read, so a quick second change never builds on stale data.
  const saveRecord = useCallback(
    async nextData => {
      setSaving(true);
      try {
        const body = { elitea_title: type, label, type, shared: false, data: nextData };
        if (record?.id) await update({ projectId, configId: record.id, body }).unwrap();
        else await create({ projectId, body }).unwrap();
        onSaved?.();
        await refreshRecord();
      } catch (error) {
        toastError(error?.data?.error || errorMessage);
      } finally {
        setSaving(false);
      }
    },
    [type, label, errorMessage, onSaved, record?.id, projectId, update, create, refreshRecord, toastError],
  );

  return { record, saveRecord, saving };
};
