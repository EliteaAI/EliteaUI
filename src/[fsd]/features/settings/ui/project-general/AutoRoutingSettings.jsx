import { memo, useCallback } from 'react';

import { MenuItem } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';
import {
  useCreateConfigurationMutation,
  useGetConfigurationsListQuery,
  useListModelsQuery,
  useUpdateConfigurationMutation,
} from '@/api/configurations';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const AutoRoutingSettings = memo(() => {
  const styles = autoRoutingSettingsStyles();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { toastError } = useToast();
  const { data: models, refetch } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );
  const { data, refetch: refreshSettings } = useGetConfigurationsListQuery(
    { projectId, type: 'auto_routing', includeShared: false },
    { skip: !projectId },
  );
  const [create, creating] = useCreateConfigurationMutation();
  const [update, updating] = useUpdateConfigurationMutation();
  const current = data?.items?.find(item => item.elitea_title === 'auto_routing');
  const value = current?.data?.enabled == null ? 'default' : String(current.data.enabled);
  const save = useCallback(
    async event => {
      const enabled = event.target.value === 'default' ? null : event.target.value === 'true';
      try {
        const body = {
          elitea_title: 'auto_routing',
          label: 'Auto model selection',
          type: 'auto_routing',
          shared: false,
          data: { enabled },
        };
        if (current?.id) await update({ projectId, configId: current.id, body }).unwrap();
        else await create({ projectId, body }).unwrap();
        refreshSettings();
        refetch();
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update Auto model selection');
      }
    },
    [current?.id, projectId, update, create, refreshSettings, refetch, toastError],
  );

  return (
    <Input.InputBase
      select
      label="Auto model selection"
      value={value}
      onChange={save}
      disabled={
        !checkPermission(PERMISSIONS.configuration.update) || creating.isLoading || updating.isLoading
      }
      helperText={
        models?.auto_routing?.enabled
          ? 'Available for chats and ordinary agents.'
          : 'Currently disabled by project or platform settings.'
      }
      containerProps={{ sx: styles.container }}
      inputProps={{ 'data-testid': 'auto-routing-project-setting' }}
    >
      <MenuItem value="default">Use platform default</MenuItem>
      <MenuItem value="true">Enabled</MenuItem>
      <MenuItem value="false">Disabled</MenuItem>
    </Input.InputBase>
  );
});

AutoRoutingSettings.displayName = 'AutoRoutingSettings';

/** @type {MuiSx} */
const autoRoutingSettingsStyles = () => ({
  container: { margin: '1rem', width: '20rem', maxWidth: 'calc(100% - 2rem)' },
});

export default AutoRoutingSettings;
