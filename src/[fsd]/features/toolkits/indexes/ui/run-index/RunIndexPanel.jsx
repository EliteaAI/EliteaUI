import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { useConversationTranscript } from '@/[fsd]/entities/run-history/lib/hooks';
import { McpAuthModal, useMcpAuthModal } from '@/[fsd]/features/mcp';
import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import {
  useDeleteIndexItemMutation,
  useSaveIndexConfigurationMutation,
  useUpdateIndexScheduleMutation,
} from '@/[fsd]/features/toolkits/indexes/api';
import {
  IndexCronDefault,
  IndexDetailsTabs,
  IndexStatuses,
  IndexesToolsEnum,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { getMockToolkitIndexConversation } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import {
  isIndexConfigDirty,
  saveConfigurationError,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexConfig.helpers';
import {
  bannerOutlivesRun,
  bannerVariant,
  hasLiveRun,
  indexBuildBlockedReason,
  indexScheduleBlockedReason,
  indexSearchBlockedReason,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { useIndexesListPolling } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { selectToolkitScheduler } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { IndexActivityPanel, IndexScheduleModal, RunIndexBanner } from '@/[fsd]/features/toolkits/indexes/ui';
import { ToolkitChatHelpers, ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useGetCurrentToolkitSchemas, useToolkitChat } from '@/[fsd]/features/toolkits/lib/hooks';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers, ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { Modal } from '@/[fsd]/shared/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useDeleteIndexScheduleMutation } from '@/api';
import { PERMISSIONS, ROLES, WELCOME_MESSAGE_ID } from '@/common/constants';
import { convertToolkitSchema } from '@/common/toolkitSchemaUtils';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema';
import useNavBlocker from '@/hooks/useNavBlocker';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import RouteDefinitions from '@/routes';

import IndexConfigurationTab from './IndexConfigurationTab';
import IndexDetailsDeleteAction from './IndexDetailsDeleteAction';
import IndexDetailsFooterBand from './IndexDetailsFooterBand';
import IndexDetailsLeftBand from './IndexDetailsLeftBand';
import IndexDetailsTabsBand from './IndexDetailsTabsBand';
import RunIndexGeneralSection from './RunIndexGeneralSection';
import RunIndexScheduleContent from './RunIndexScheduleContent';

const RunIndexPanel = memo(props => {
  const {
    toolkitId,
    indexName,
    index,
    refetchIndexesList,
    selectedIndexTools,
    tab,
    initialConversation,
    toolkitName,
    isCreating,
  } = props;
  const styles = runIndexPanelStyles();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError } = useToast();
  const { values } = useFormikContext();

  const [activeTab, setActiveTab] = useState(IndexDetailsTabs.activity);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reindexConfirmOpen, setReindexConfirmOpen] = useState(false);
  const [configInputVariables, setConfigInputVariables] = useState({});
  const [savedConfig, setSavedConfig] = useState(null);
  const [localMetaOverride, setLocalMetaOverride] = useState(null);
  const overrideObservedAtRef = useRef(null);
  const [deleteScheduleOpen, setDeleteScheduleOpen] = useState(false);

  const { id: userId, permissions: userPermissions } = useSelector(state => state.user);
  const currentProjectName = useSelector(state => state.settings.project.name);
  const toolkitScheduler = useSelector(selectToolkitScheduler);
  const [updateIndexSchedule] = useUpdateIndexScheduleMutation();
  const [saveIndexConfiguration, { isLoading: isSavingConfig }] = useSaveIndexConfigurationMutation();
  const [deleteIndexSchedule] = useDeleteIndexScheduleMutation();

  const scheduleData = useMemo(() => {
    const schedule =
      toolkitScheduler[indexName]?.schedules?.[userId] ?? toolkitScheduler[indexName]?.schedules?.[-1];
    return schedule ?? {};
  }, [toolkitScheduler, indexName, userId]);

  const configSchema = useGetSelectedToolSchema({
    toolkitType: values.type,
    toolOptionType: IndexesToolsEnum.indexData,
  });

  const traceNewIndex = useCallback((id, metadata) => {
    if (!metadata) return;
    overrideObservedAtRef.current = Date.now();
    setLocalMetaOverride(prev => ({ ...(prev || {}), ...metadata }));
  }, []);

  // Stable ref wrapper so useMcpAuthModal can be declared after useToolkitChat
  // without creating a circular dependency.
  const mcpAuthRequiredRef = useRef(null);
  const onMcpAuthRequiredStable = useCallback(message => {
    mcpAuthRequiredRef.current?.(message);
  }, []);

  const {
    chatHistory,
    isIndexing,
    isRunning,
    isStoppingIndexing,
    isWaitingForTaskStart,
    canStopIndexing,
    handleClearChat,
    handleClearActiveConversation,
    handleIndexData,
    retryLastRun,
    onCancelIndexing,
  } = useToolkitChat({
    cancelIndexingCallback: () => {
      traceNewIndex(index?.id ?? null, {
        state: IndexStatuses.cancelled,
        task_id: null,
      });
    },
    index,
    indexConfigOverride: configInputVariables,
    refetchIndexesList,
    toolkitId,
    traceNewIndex,
    values,
    modes: [],
    initialConversation,
    isCreating,
    onMcpAuthRequired: onMcpAuthRequiredStable,
  });

  const { handleMcpAuthRequired, getModalProps } = useMcpAuthModal({
    values,
    onSuccess: retryLastRun,
    showSuccessToast: false,
  });

  // Wire the stable wrapper to the real handler after both hooks are initialized.
  mcpAuthRequiredRef.current = handleMcpAuthRequired;

  const [deleteIndex, { isLoading: isDeleting }] = useDeleteIndexItemMutation();

  const { toolkitSchemas } = useGetCurrentToolkitSchemas({ isMCP: false });
  const toolkitType = values?.type || '';
  const toolkitSchema = useMemo(
    () => convertToolkitSchema(toolkitSchemas?.[toolkitType]),
    [toolkitSchemas, toolkitType],
  );

  const credentialsData = useMemo(() => {
    const entry = Object.entries(toolkitSchema?.properties || {}).find(
      // eslint-disable-next-line no-unused-vars
      ([_key, prop]) => prop.section?.includes('credentials') ?? null,
    );
    return entry ? entry[1] : null;
  }, [toolkitSchema]);

  const effectiveState = localMetaOverride?.state ?? index?.metadata?.state;
  const effectiveIsIndexing = isIndexing || effectiveState === IndexStatuses.progress;
  // Runs observed here aren't in the slice until a fetch happens — arm the poll from
  // local belief. (Second subscription on this route is deliberate; see the hook.)
  const { startedTimeStamp, fulfilledTimeStamp } = useIndexesListPolling({
    toolkitId,
    projectId,
    skip: !projectId || !toolkitId,
    forcePoll: effectiveState === IndexStatuses.progress,
  });
  // The row-level stale flag is untouched by the metadata-only overrides, so an
  // observed transition suppresses it — but a hard-killed run never emits the
  // terminal trace that would end the suppression, so a completed snapshot from a
  // request issued after the observation supersedes it (in-flight fetches carry
  // pre-run data).
  const serverSupersedes = Boolean(
    startedTimeStamp &&
    fulfilledTimeStamp &&
    overrideObservedAtRef.current &&
    startedTimeStamp > overrideObservedAtRef.current &&
    fulfilledTimeStamp >= startedTimeStamp,
  );
  const effectiveStale = localMetaOverride?.state && !serverSupersedes ? false : index?.stale;
  const isAwaitingTaskStart = isWaitingForTaskStart && !serverSupersedes;
  const runLooksAbandoned = effectiveIsIndexing && Boolean(effectiveStale);
  const runIsLive = hasLiveRun({
    isIndexing: effectiveIsIndexing,
    isStale: effectiveStale,
  });
  const deleteDisabled = isDeleting || isAwaitingTaskStart || runIsLive;
  const buildBlockedReason = indexBuildBlockedReason(selectedIndexTools);
  const reindexDisabled = Boolean(buildBlockedReason) || isRunning || isAwaitingTaskStart || runIsLive;

  const schedulingTooltipMessage = useMemo(
    () =>
      indexScheduleBlockedReason({
        state: effectiveState,
        hasSchedulePermission:
          !Array.isArray(userPermissions) || userPermissions.includes(PERMISSIONS.index.schedule),
        projectName: currentProjectName,
        scheduleEnabled: scheduleData.enabled,
        buildBlockedReason,
      }),
    [buildBlockedReason, effectiveState, userPermissions, scheduleData.enabled, currentProjectName],
  );

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleModalIsEdit, setScheduleModalIsEdit] = useState(false);

  const handleChangeIndexSchedule = useCallback(
    async (data, enabling) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      try {
        await updateIndexSchedule({
          projectId,
          toolkitId,
          indexName,
          timezone,
          ...data,
        }).unwrap();
        if (enabling) {
          toastSuccess(`Schedule has been successfully ${data.enabled ? 'enabled' : 'disabled'}.`);
        } else {
          toastSuccess(`Schedule has been successfully ${scheduleModalIsEdit ? 'updated' : 'created'}.`);
        }
      } catch {
        if (enabling) {
          toastError(`Failed to ${data.enabled ? 'enable' : 'disable'} schedule.`);
        } else {
          toastError(`Failed to ${scheduleModalIsEdit ? 'update' : 'create'} schedule.`);
        }
      }
    },
    [updateIndexSchedule, projectId, toolkitId, indexName, toastSuccess, scheduleModalIsEdit, toastError],
  );
  const scheduleSummary = useMemo(() => {
    if (!scheduleData.cron) return null;
    const cron = scheduleData.cron || IndexCronDefault;
    // Convert cron time to browser timezone for display
    return ScheduleHelpers.getCronSummaryInBrowserTimezone(cron, scheduleData.timezone);
  }, [scheduleData.cron, scheduleData.timezone]);

  const scheduleTimezoneHint = useMemo(() => {
    const scheduleTz = scheduleData.timezone;
    if (!scheduleTz) return null;

    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (scheduleTz === browserTz) return null;
      // Only show the browser timezone (where it's shown), not the original scheduled timezone
      return `Shown: ${browserTz}`;
    } catch {
      return null;
    }
  }, [scheduleData.timezone]);

  const scheduleNextRun = useMemo(() => {
    if (!scheduleData.cron) return null;
    const cron = scheduleData.cron || IndexCronDefault;
    const date = ScheduleHelpers.getNextCronRunInTimezone(cron, scheduleData.timezone);

    if (!date) return null;
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [scheduleData.cron, scheduleData.timezone]);

  const handleApplyScheduleModal = useCallback(
    (cron, credentials) => {
      handleChangeIndexSchedule(
        { ...scheduleData, cron, credentials, enabled: scheduleModalIsEdit ? scheduleData.enabled : true },
        false,
      );
    },
    [handleChangeIndexSchedule, scheduleData, scheduleModalIsEdit],
  );

  useEffect(() => {
    if (!localMetaOverride) return;
    if (index?.metadata?.state === localMetaOverride.state) setLocalMetaOverride(null);
  }, [index?.metadata?.state, localMetaOverride]);

  const handleChangeTab = useCallback((_event, value) => setActiveTab(value), []);

  const openConfigurationTab = useCallback(() => setActiveTab(IndexDetailsTabs.configuration), []);

  const openDelete = useCallback(() => setDeleteOpen(true), []);
  const closeDelete = useCallback(() => setDeleteOpen(false), []);
  const confirmDelete = useCallback(async () => {
    if (!index) return;
    try {
      await deleteIndex({
        projectId,
        toolkitId,
        indexId: index.id,
        indexName: index.metadata?.collection,
      }).unwrap();
      toastSuccess(`The ${index.metadata?.collection} index has been successfully deleted.`);
      setDeleteOpen(false);
      const target = RouteDefinitions.ToolkitDetail.replace(':tab', tab ?? 'all').replace(
        ':toolkitId',
        String(toolkitId),
      );

      navigate(target, { replace: true });
    } catch {
      toastError('Failed to delete index');
    }
  }, [deleteIndex, index, navigate, projectId, tab, toastError, toastSuccess, toolkitId]);

  const closeDeleteSchedule = useCallback(() => setDeleteScheduleOpen(false), []);

  const scheduleOwnerUserId = useMemo(() => {
    const schedules = toolkitScheduler[indexName]?.schedules ?? {};
    if (schedules[userId] != null) return userId;
    if (schedules[-1] != null) return -1;
    return userId;
  }, [toolkitScheduler, indexName, userId]);

  const confirmDeleteSchedule = useCallback(async () => {
    setDeleteScheduleOpen(false);
    try {
      await deleteIndexSchedule({
        toolkitId,
        projectId,
        indexName: index.metadata?.collection ?? indexName,
        userId: scheduleOwnerUserId,
      }).unwrap();
      toastSuccess('Schedule has been successfully deleted.');
    } catch {
      toastError('Failed to delete schedule.');
    }
  }, [
    deleteIndexSchedule,
    index.metadata?.collection,
    indexName,
    projectId,
    scheduleOwnerUserId,
    toastError,
    toastSuccess,
    toolkitId,
  ]);

  const configFields = useMemo(() => Object.keys(configSchema?.properties || {}), [configSchema]);

  const configuredValues = useMemo(
    () => index?.metadata?.index_configuration || {},
    [index?.metadata?.index_configuration],
  );

  // The baseline is what the server last confirmed, and it is the only thing the form is compared
  // against. Seeding local state from `prev` instead would make the two indistinguishable, so a
  // save could never hand the form a clean slate.
  useEffect(() => {
    if (!configSchema?.properties || !index?.metadata || savedConfig) return;
    setSavedConfig(configuredValues);
    setConfigInputVariables(configuredValues);
  }, [configSchema, configuredValues, index?.metadata, savedConfig]);

  const isConfigDirty = useMemo(
    () => isIndexConfigDirty(configSchema, configInputVariables, savedConfig ?? configuredValues),
    [configSchema, configInputVariables, savedConfig, configuredValues],
  );

  const configIsValid = useMemo(
    () => !configSchema || ToolkitChatHelpers.validateToolkitForm(configSchema, configInputVariables),
    [configSchema, configInputVariables],
  );
  const configInvalidReason = configIsValid ? undefined : 'Fill in all required configuration fields';
  // A clean form is reindexed from the stored configuration, so its validity is not the user's
  // problem until they edit it.
  const reindexBlockedReason = buildBlockedReason ?? (isConfigDirty ? configInvalidReason : undefined);

  const blockOptions = useMemo(() => ({ blockCondition: isConfigDirty }), [isConfigDirty]);
  const { setBlockNav } = useNavBlocker(blockOptions);

  // The flag lives in the store, and the modal only consults it, so leaving the page dirty would
  // otherwise arm the warning for whoever mounts on a blockable route next.
  useEffect(() => () => setBlockNav(false), [setBlockNav]);

  const saveConfiguration = useCallback(async () => {
    const { configuration } = await saveIndexConfiguration({
      projectId,
      toolkitId,
      indexName: index?.metadata?.collection ?? indexName,
      configuration: configInputVariables,
    }).unwrap();

    // Rebased from the response rather than from local state: the server restores index_name and
    // may normalize values, and a baseline that disagreed would leave the form dirty forever.
    setSavedConfig(configuration);
    setConfigInputVariables(configuration);
  }, [
    saveIndexConfiguration,
    projectId,
    toolkitId,
    index?.metadata?.collection,
    indexName,
    configInputVariables,
  ]);

  const handleSaveConfiguration = useCallback(async () => {
    try {
      await saveConfiguration();
      toastSuccess('Configuration saved. Changes will apply during the next reindex.');
    } catch (error) {
      toastError(saveConfigurationError(error));
    }
  }, [saveConfiguration, toastSuccess, toastError]);

  const handleReindex = useCallback(() => setReindexConfirmOpen(true), []);
  const confirmReindex = useCallback(async () => {
    setReindexConfirmOpen(false);

    // start_index_task dispatches the worker before it persists, so it cannot abort a run on a
    // failed save. Saving here first is what keeps a rejected configuration from starting one.
    if (isConfigDirty) {
      try {
        await saveConfiguration();
      } catch (error) {
        toastError(saveConfigurationError(error));
        return;
      }
    }

    handleClearActiveConversation();
    handleClearChat();
    handleIndexData();
  }, [
    isConfigDirty,
    saveConfiguration,
    toastError,
    handleClearActiveConversation,
    handleClearChat,
    handleIndexData,
  ]);
  const cancelReindexConfirm = useCallback(() => setReindexConfirmOpen(false), []);

  const reindexStats = useMemo(() => {
    const md = index?.metadata;
    if (!md) return { isReindex: false, updatedOn: null, firstEntry: null, latestEntry: null };

    const completedRuns = Array.isArray(md.history)
      ? md.history.filter(h => RUNNABLE_INDEX_STATUSES.includes(h?.state))
      : [];
    const sortedHistory = [...completedRuns].sort((a, b) => (a?.created_on ?? 0) - (b?.created_on ?? 0));
    const latestEntry = sortedHistory[sortedHistory.length - 1] ?? null;

    return {
      isReindex: completedRuns.length > 1,
      createdOn: sortedHistory[0]?.created_on ?? null,
      updatedOn: md.updated_on ?? null,
      firstEntry: sortedHistory[0] ?? null,
      latestEntry,
    };
  }, [index?.metadata]);
  const runInFlight = effectiveIsIndexing || isAwaitingTaskStart;
  const banner = useMemo(
    () => bannerVariant(runInFlight, effectiveState, reindexStats, index?.metadata?.error, effectiveStale),
    [runInFlight, effectiveState, reindexStats, index?.metadata?.error, effectiveStale],
  );

  const onAddSchedule = useCallback(() => {
    setScheduleModalIsEdit(false);
    setScheduleModalOpen(true);
  }, []);

  const onEditSchedule = useCallback(() => {
    setScheduleModalIsEdit(true);
    setScheduleModalOpen(true);
  }, []);

  const onDeleteSchedule = useCallback(() => {
    setDeleteScheduleOpen(true);
  }, []);

  const scheduleAccordionItems = [
    {
      title: 'Schedule',
      testId: 'index-schedule-accordion-summary',
      content: (
        <RunIndexScheduleContent
          enabled={scheduleData.enabled}
          scheduleSummary={scheduleSummary}
          timezoneHint={scheduleTimezoneHint}
          nextRun={scheduleNextRun}
          credentialsTitle={scheduleData.credentials?.elitea_title}
          onAddSchedule={onAddSchedule}
          onEdit={onEditSchedule}
          onDelete={onDeleteSchedule}
          onToggle={() =>
            handleChangeIndexSchedule({ ...scheduleData, enabled: !scheduleData.enabled }, true)
          }
          disabledReason={schedulingTooltipMessage}
          toolkitName={toolkitName}
        />
      ),
    },
  ];
  const liveMessages = useMemo(
    () => chatHistory?.filter(msg => msg.id !== WELCOME_MESSAGE_ID),
    [chatHistory],
  );
  const hasLiveMessages = liveMessages?.length > 0;

  const { transcript: pastRunTranscript, isTranscriptLoading } = useConversationTranscript({
    conversationId: index?.metadata?.conversation_id ?? null,
    skip: runInFlight || hasLiveMessages,
  });
  const pastRunMessages = useMemo(
    () =>
      ToolkitsHelpers.prettifyToolkitConversation(
        pastRunTranscript.filter(message => message.role === ROLES.Assistant),
      ),
    [pastRunTranscript],
  );

  const indexingMessages = hasLiveMessages ? liveMessages : pastRunMessages;
  const chatConversation = useMemo(
    () => getMockToolkitIndexConversation(indexingMessages),
    [indexingMessages],
  );
  const questionItemRef = useRef();

  const searchBlockedReason = indexSearchBlockedReason(
    effectiveIsIndexing ? IndexStatuses.progress : effectiveState,
    selectedIndexTools,
    runLooksAbandoned,
  );

  const runBlocksHistory = effectiveIsIndexing && !runLooksAbandoned;
  const historyDisabled = !index?.metadata?.history?.length || runBlocksHistory;
  const historyTooltip = runBlocksHistory
    ? 'Unavailable while indexing is in progress'
    : historyDisabled
      ? 'No history available'
      : 'View index history';

  const isConfigurationTab = activeTab === IndexDetailsTabs.configuration;
  const isActivityTab = activeTab === IndexDetailsTabs.activity;

  const hasTranscript = indexingMessages?.length > 0;
  const hasIndexingActivity = runInFlight || hasTranscript || isTranscriptLoading;
  const showStatusBanner = hasIndexingActivity || bannerOutlivesRun(banner.severity);

  const indexRouteParams = useMemo(
    () => ({ tab: tab ?? 'all', toolkitId, indexName }),
    [tab, toolkitId, indexName],
  );

  const goToHistory = useCallback(() => {
    navigate(NavigationHelpers.buildRoute(RouteDefinitions.ToolkitIndexHistory, indexRouteParams));
  }, [navigate, indexRouteParams]);

  const goToSearch = useCallback(() => {
    navigate(NavigationHelpers.buildRoute(RouteDefinitions.ToolkitIndexSearch, indexRouteParams));
  }, [navigate, indexRouteParams]);

  return (
    <>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs />}
        extraContent={
          <IndexDetailsDeleteAction
            disabled={deleteDisabled}
            onDelete={openDelete}
          />
        }
      />
      <Box sx={styles.body}>
        <Box sx={styles.leftColumn}>
          <IndexDetailsLeftBand
            indexName={indexName}
            historyDisabled={historyDisabled}
            historyTooltip={historyTooltip}
            onShowHistory={goToHistory}
            searchBlockedReason={searchBlockedReason}
            onSearch={goToSearch}
          />
          <Box
            data-testid="index-details-info-panel"
            sx={styles.leftBody}
          >
            <Box sx={styles.stats}>
              <RunIndexGeneralSection
                index={index}
                reindexStats={reindexStats}
              />
            </Box>
            <BasicAccordion
              card
              accordionSX={styles.accordion}
              accordionDetailsSX={styles.accordionDetails}
              items={scheduleAccordionItems}
            />
          </Box>
        </Box>

        <Box sx={styles.rightColumn}>
          <IndexDetailsTabsBand
            activeTab={activeTab}
            onChangeTab={handleChangeTab}
          />
          {showStatusBanner && (
            <RunIndexBanner
              fullBleed
              banner={banner}
            />
          )}
          <Box sx={styles.tabBody}>
            {isConfigurationTab && (
              <IndexConfigurationTab
                configFields={configFields}
                configSchema={configSchema}
                configInputVariables={configInputVariables}
                onChangeInputVariables={setConfigInputVariables}
                disabled={isRunning || runIsLive}
              />
            )}
            {isActivityTab && (
              <IndexActivityPanel
                hasActivity={hasIndexingActivity}
                statusShownAbove={showStatusBanner}
                chatHistory={indexingMessages}
                chatConversation={chatConversation}
                questionItemRef={questionItemRef}
                onOpenConfiguration={openConfigurationTab}
              />
            )}
          </Box>
          <IndexDetailsFooterBand
            isRunActive={runIsLive || isAwaitingTaskStart}
            isStoppingIndexing={isStoppingIndexing}
            canStopIndexing={canStopIndexing}
            onStop={onCancelIndexing}
            reindexDisabled={reindexDisabled || (isConfigDirty && !configIsValid)}
            reindexTooltip={reindexBlockedReason}
            onReindex={handleReindex}
            isDirty={isConfigDirty}
            isSaving={isSavingConfig}
            saveDisabled={!configIsValid}
            saveTooltip={configInvalidReason}
            onSave={handleSaveConfiguration}
          />
        </Box>
      </Box>

      <Modal.DeleteEntityModal
        name="schedule"
        shouldRequestInputName={false}
        open={deleteScheduleOpen}
        onClose={closeDeleteSchedule}
        onConfirm={confirmDeleteSchedule}
      />

      <Modal.DeleteEntityModal
        name={index?.metadata?.collection || indexName}
        shouldRequestInputName
        open={deleteOpen}
        onClose={closeDelete}
        onConfirm={confirmDelete}
      />

      <Modal.DeleteEntityModal
        title="Reindex confirmation"
        name={indexName}
        shouldRequestInputName={false}
        open={reindexConfirmOpen}
        confirmButtonText="Reindex"
        cancelButtonText="Cancel"
        onClose={cancelReindexConfirm}
        onConfirm={confirmReindex}
        textContent="Are you sure to reindex the "
        inlineExtraContent=" index?"
        extraContent={
          <Typography variant="bodyMedium">
            {"This will replace all current index data and can't be undone once started."}
          </Typography>
        }
        alarm={false}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.info}
      />
      <IndexScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSubmit={handleApplyScheduleModal}
        cron={scheduleData.cron ?? IndexCronDefault}
        credentials={scheduleData.credentials}
        credentialsData={credentialsData}
        isEdit={scheduleModalIsEdit}
        toolkitName={toolkitName}
      />
      <McpAuthModal {...getModalProps()} />
    </>
  );
});

RunIndexPanel.displayName = 'RunIndexPanel';

/** @type {MuiSx} */
const runIndexPanelStyles = () => ({
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
  },
  leftColumn: {
    flex: 0.8,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    borderRight: ({ palette }) => `0.0625rem solid ${palette.border.table}`,
    background: ({ palette }) => palette.background.toolkitDetailLeftPanel,
  },
  accordion: {
    background: 'transparent',
  },
  accordionDetails: {
    padding: '1rem 0.75rem 0.75rem',
  },
  leftBody: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '0.5rem 1.5rem 1rem 1.5rem',
  },
  stats: {
    paddingLeft: '0.75rem',
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
  },
  tabBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
  },
});

export default RunIndexPanel;
