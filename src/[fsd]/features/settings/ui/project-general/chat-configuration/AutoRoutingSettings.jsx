import { memo, useCallback } from 'react';

import { Box, MenuItem, Typography } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
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

const AUTO_ROUTING_TOOLTIP =
  'Auto lets ELITEA choose the best model for each message, based on the task and current availability. This setting controls whether users can pick Auto in the model selector for chats and standard agents in this project. **Use platform default** follows the setting chosen by your ELITEA administrators.';

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
    <Box
      sx={styles.card}
      data-testid="auto-routing-settings-card"
    >
      <Box sx={styles.text}>
        <Box sx={styles.titleGroup}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Auto model selection
          </Typography>
          <InfoTooltip
            infoTooltip={AUTO_ROUTING_TOOLTIP}
            testId="auto-routing-info-tooltip"
          />
        </Box>
        <Typography
          variant="bodySmall"
          sx={styles.description}
        >
          Allow Auto model selection in chats and standard agents.
        </Typography>
        {models && !models.auto_routing?.enabled && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid="auto-routing-disabled-hint"
          >
            Currently disabled by project or platform settings.
          </Typography>
        )}
      </Box>
      <Input.InputBase
        select
        value={value}
        onChange={save}
        disabled={
          !checkPermission(PERMISSIONS.configuration.update) || creating.isLoading || updating.isLoading
        }
        containerProps={{ sx: styles.select }}
        inputProps={{ 'data-testid': 'auto-routing-project-setting' }}
      >
        <MenuItem value="default">Use platform default</MenuItem>
        <MenuItem value="true">Enabled</MenuItem>
        <MenuItem value="false">Disabled</MenuItem>
      </Input.InputBase>
    </Box>
  );
});

AutoRoutingSettings.displayName = 'AutoRoutingSettings';

/** @type {MuiSx} */
const autoRoutingSettingsStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.surface.interactive.default,
    gap: '1rem',
  }),
  // The text grows much faster than the dropdown, so on one line the dropdown stays at its
  // 15rem basis; once the card is too narrow it wraps below and stretches to full width.
  text: {
    flex: '999 1 20rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  description: ({ palette }) => ({
    color: palette.text.primary,
  }),
  select: {
    flex: '1 1 15rem',
  },
});

export default AutoRoutingSettings;
