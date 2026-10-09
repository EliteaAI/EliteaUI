import { memo, useCallback, useMemo } from 'react';

import { Box, MenuItem, Typography } from '@mui/material';

import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Input, Select } from '@/[fsd]/shared/ui';
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

const AUTO_ROUTING_TOOLTIP =
  'Auto lets ELITEA choose the best model for each message, based on the task and current availability. This setting controls whether users can pick Auto in the model selector for chats and standard agents in this project. **Use platform default** follows the setting chosen by your ELITEA administrators.';

const CLASSIFIER_TOOLTIP =
  'The **Classifier** reads each request and the relevant conversation context, then decides which model Auto uses for the answer. It runs on every Auto request, so choose a **fast, low-cost** model: Haiku, Luna, Gemini Flash, or a mini/nano model. A larger model here adds cost and latency to every request without improving the answer, because the answer comes from the model Auto selects. Only low-tier models are listed; mark a model as Low-tier in AI Providers to make it selectable. **Use platform default** follows the classifier chosen by your ELITEA administrators.';
const PLATFORM_DEFAULT = '__platform_default__';
const NON_CHAT_KINDS = ['embedding', 'image', 'audio', 'video'];
const classifierKey = ref => `${ref.name}<<>>${ref.project_id}`;
const isChat = model => !NON_CHAT_KINDS.includes(model.identity?.kind);
const isLowTier = model => model.low_tier === true || model.identity?.low_tier_hint === true;
const toOption = model => ({
  value: classifierKey(model),
  label: model.display_name || model.name,
  description: model.display_name && model.display_name !== model.name ? model.name : undefined,
});

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
  const classifier = current?.data?.classifier ?? null;
  const readiness = models?.auto_routing?.readiness;
  const platformClassifier =
    readiness?.platform_classifier ??
    (readiness?.classifier?.source === 'platform' ? readiness.classifier : null);

  const { classifierOptions, showAllHint } = useMemo(() => {
    const chat = (models?.items || []).filter(isChat);
    const lowTier = chat.filter(isLowTier);
    const listed = lowTier.length ? lowTier : chat;
    const options = [
      {
        value: PLATFORM_DEFAULT,
        label: platformClassifier
          ? `Use platform default (${platformClassifier.display_name || platformClassifier.name})`
          : 'Use platform default',
      },
      ...listed.map(toOption),
    ];
    // Keep the saved value visible even when the low-tier filter hides it or it no longer exists.
    if (models && classifier && !options.some(option => option.value === classifierKey(classifier))) {
      const known = chat.find(model => classifierKey(model) === classifierKey(classifier));
      options.push(
        known
          ? toOption(known)
          : { value: classifierKey(classifier), label: `${classifier.name} (unavailable)` },
      );
    }
    return { classifierOptions: options, showAllHint: !!models && chat.length > 0 && !lowTier.length };
  }, [models, classifier, platformClassifier]);

  const persist = useCallback(
    async nextData => {
      try {
        const body = {
          elitea_title: 'auto_routing',
          label: 'Auto model selection',
          type: 'auto_routing',
          shared: false,
          data: nextData,
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
  const saveEnabled = useCallback(
    event =>
      persist({
        enabled: event.target.value === 'default' ? null : event.target.value === 'true',
        classifier,
      }),
    [persist, classifier],
  );
  const saveClassifier = useCallback(
    event => {
      const [name, project_id] = String(event.target.value).split('<<>>');
      persist({
        enabled: current?.data?.enabled ?? null,
        classifier: event.target.value === PLATFORM_DEFAULT ? null : { name, project_id: +project_id },
      });
    },
    [persist, current?.data?.enabled],
  );
  const disabled =
    !checkPermission(PERMISSIONS.configuration.update) || creating.isLoading || updating.isLoading;

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
        onChange={saveEnabled}
        disabled={disabled}
        containerProps={{ sx: styles.select }}
        inputProps={{ 'data-testid': 'auto-routing-project-setting' }}
      >
        <MenuItem value="default">Use platform default</MenuItem>
        <MenuItem value="true">Enabled</MenuItem>
        <MenuItem value="false">Disabled</MenuItem>
      </Input.InputBase>
      <Box sx={styles.classifierRow}>
        <Select.SingleSelect
          separateLabel
          label="Classifier"
          infoIconDescription={CLASSIFIER_TOOLTIP}
          infoTooltipTestId="auto-routing-classifier-info-tooltip"
          data-testid="auto-routing-classifier"
          showOptionDescription
          options={classifierOptions}
          value={classifier ? classifierKey(classifier) : PLATFORM_DEFAULT}
          onChange={saveClassifier}
          disabled={disabled}
        />
        {showAllHint && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            No low-tier models are flagged; showing all models.
          </Typography>
        )}
        {models?.auto_routing?.enabled && readiness?.ready === false && (
          <Typography
            variant="bodySmall"
            color="error.main"
            data-testid="auto-routing-not-ready"
          >
            {`Auto model selection is enabled but not ready: ${readiness.reasons?.[0]?.message ?? 'Auto cannot run'}. Select a replacement classifier.`}
          </Typography>
        )}
      </Box>
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
  classifierRow: {
    flex: '1 1 100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
});

export default AutoRoutingSettings;
