import { MenuItem, TextField } from '@mui/material';

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

export default function AutoRoutingSettings() {
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
  const save = async event => {
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
  };
  return (
    <TextField
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
      sx={{ m: 2, minWidth: 320 }}
    >
      <MenuItem value="default">Use platform default</MenuItem>
      <MenuItem value="true">Enabled</MenuItem>
      <MenuItem value="false">Disabled</MenuItem>
    </TextField>
  );
}
