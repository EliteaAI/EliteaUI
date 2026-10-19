import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import {
  useCreateConfigurationMutation,
  useGetConfigurationsListQuery,
  useUpdateConfigurationMutation,
} from '@/api/configurations';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import { useToolkitsListQuery } from '@/api/toolkits';
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const SETTINGS_TYPE = 'web_search_settings';
const NONE = '__none__';
const WEB_SEARCH_TOOLTIP =
  'The **Web Search** module uses the toolkit chosen by your ELITEA administrators. To use your own provider key, create a web-search toolkit and add it to the chat or agent.';
const PUBLIC_TOOLTIP =
  'The toolkit every project uses for the **Web Search** module. Only toolkits marked **Shared with all projects** are listed.';

const WebSearchSettings = memo(() => {
  const styles = webSearchSettingsStyles();
  const projectId = useSelectedProjectId();
  const isPublic = +projectId === PUBLIC_PROJECT_ID;
  const { checkPermission } = useCheckPermission();
  const { toastError } = useToast();
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();

  // A toolkit type is a web-search backend when its schema declares the feature
  const webSearchTypes = useMemo(
    () =>
      Object.entries(toolkitSchemas || {})
        .filter(([, schema]) => schema?.metadata?.tool_spend?.feature === 'web_search')
        .map(([type]) => type),
    [toolkitSchemas],
  );

  const { data: toolkits } = useToolkitsListQuery(
    { projectId, page: 0, page_size: 100, params: { toolkit_type: webSearchTypes } },
    { skip: !isPublic || !webSearchTypes.length },
  );
  const { data: settingsList, refetch: refreshSettings } = useGetConfigurationsListQuery(
    { projectId, type: SETTINGS_TYPE, includeShared: false },
    { skip: !isPublic },
  );
  const { data: platformSettings, refetch: refreshAvailability } = useGetPlatformSettingsQuery(
    { projectId },
    { skip: !projectId },
  );
  const [create] = useCreateConfigurationMutation();
  const [update] = useUpdateConfigurationMutation();

  const current = settingsList?.items?.find(item => item.elitea_title === SETTINGS_TYPE);
  const toolkitId = current?.data?.toolkit_id ?? null;
  const availability = platformSettings?.tool_spend?.web_search;

  const options = useMemo(() => {
    const listed = (toolkits?.rows || [])
      .filter(row => row.meta?.shared)
      .map(row => ({ value: String(row.id), label: row.name }));
    if (toolkitId && !listed.some(option => option.value === String(toolkitId))) {
      listed.push({ value: String(toolkitId), label: `Toolkit ${toolkitId} (unavailable)` });
    }
    return [{ value: NONE, label: 'None (Web Search off)' }, ...listed];
  }, [toolkits, toolkitId]);

  const [saving, setSaving] = useState(false);
  const onChange = useCallback(
    async event => {
      const picked = event.target.value;
      setSaving(true);
      try {
        const body = {
          elitea_title: SETTINGS_TYPE,
          label: 'Web Search',
          type: SETTINGS_TYPE,
          shared: false,
          data: { toolkit_id: picked === NONE ? null : +picked },
        };
        if (current?.id) await update({ projectId, configId: current.id, body }).unwrap();
        else await create({ projectId, body }).unwrap();
        await refreshSettings();
        refreshAvailability();
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update Web Search settings');
      } finally {
        setSaving(false);
      }
    },
    [current?.id, projectId, update, create, refreshSettings, refreshAvailability, toastError],
  );

  const disabled = !checkPermission(PERMISSIONS.configuration.update) || saving;
  const platformName = availability?.toolkit?.name;

  return (
    <Box
      sx={styles.card}
      data-testid="web-search-settings-card"
    >
      <Box sx={styles.text}>
        <Box sx={styles.titleGroup}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Web Search
          </Typography>
          <InfoTooltip infoTooltip={isPublic ? PUBLIC_TOOLTIP : WEB_SEARCH_TOOLTIP} />
        </Box>
        <Typography
          variant="bodySmall"
          sx={styles.description}
        >
          {isPublic
            ? 'Toolkit every project uses for the Web Search module.'
            : `Uses the platform toolkit${platformName ? ` (${platformName})` : ''}.`}
        </Typography>
        {availability && !availability.available && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid="web-search-unavailable-hint"
          >
            {availability.reason === 'no_toolkit'
              ? 'No web-search toolkit is available yet.'
              : 'Web Search is currently disabled by project or platform settings.'}
          </Typography>
        )}
      </Box>
      {isPublic && (
        <Box sx={styles.select}>
          <Select.SingleSelect
            data-testid="web-search-toolkit"
            options={options}
            value={toolkitId ? String(toolkitId) : NONE}
            onChange={onChange}
            disabled={disabled}
          />
        </Box>
      )}
    </Box>
  );
});

WebSearchSettings.displayName = 'WebSearchSettings';

/** @type {MuiSx} */
const webSearchSettingsStyles = () => ({
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

export default WebSearchSettings;
