import { useCallback, useState } from 'react';

import { ContextStrategyConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import {
  useCreateConfigurationMutation,
  useGetConfigurationsListQuery,
  useUpdateConfigurationMutation,
} from '@/api/configurations';

const SETTINGS_TYPE = 'context_window_settings';

/**
 * Admin-set project default context window mode for new chats (#6898).
 */
export const useProjectContextWindowMode = () => {
  const { CONTEXT_WINDOW_MODES } = ContextStrategyConstants;
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { data, refetch, isFetching } = useGetConfigurationsListQuery(
    { projectId, type: SETTINGS_TYPE, includeShared: false },
    { skip: !projectId },
  );
  const [create] = useCreateConfigurationMutation();
  const [update] = useUpdateConfigurationMutation();
  const [saving, setSaving] = useState(false);

  const current = data?.items?.find(item => item.elitea_title === SETTINGS_TYPE);
  const mode = current?.data?.default_mode || CONTEXT_WINDOW_MODES.BALANCED;

  const saveMode = useCallback(
    async nextMode => {
      setSaving(true);
      try {
        const body = {
          elitea_title: SETTINGS_TYPE,
          label: 'Context window',
          type: SETTINGS_TYPE,
          shared: false,
          data: { default_mode: nextMode },
        };
        if (current?.id) await update({ projectId, configId: current.id, body }).unwrap();
        else await create({ projectId, body }).unwrap();
        await refetch();
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update the context window setting');
      } finally {
        setSaving(false);
      }
    },
    [current?.id, projectId, update, create, refetch, toastError],
  );

  return { mode, saveMode, saving: saving || isFetching };
};
