import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import cronstrue from 'cronstrue';
import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { McpAuthModal, useMcpAuthModal } from '@/[fsd]/features/mcp';
import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import {
  useDeleteIndexItemMutation,
  useUpdateIndexScheduleMutation,
} from '@/[fsd]/features/toolkits/indexes/api';
import {
  BannerSeverity,
  IndexCronDefault,
  IndexDetailsTabs,
  IndexStatuses,
  IndexesToolsEnum,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  adjustIndexDataSchema,
  getMockToolkitIndexConversation,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import {
  bannerVariant,
  hasLiveRun,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { useIndexesListPolling } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { selectToolkitScheduler } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { IndexError, IndexScheduleModal, IndexSuccess } from '@/[fsd]/features/toolkits/indexes/ui';
import { ToolkitChatHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useGetCurrentToolkitSchemas, useToolkitChat } from '@/[fsd]/features/toolkits/lib/hooks';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { Modal } from '@/[fsd]/shared/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useDeleteIndexScheduleMutation } from '@/api';
import { PERMISSIONS, WELCOME_MESSAGE_ID } from '@/common/constants';
import { convertToolkitSchema } from '@/common/toolkitSchemaUtils';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import RouteDefinitions from '@/routes';

import IndexConfigurationTab from './IndexConfigurationTab';
import IndexDetailsDeleteAction from './IndexDetailsDeleteAction';
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
  const [selectedSearchTool, setSelectedSearchTool] = useState(null);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const [hasIndexedThisSession, setHasIndexedThisSession] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reindexConfirmOpen, setReindexConfirmOpen] = useState(false);
  const [toolInputVariables, setToolInputVariables] = useState({});
  const [configInputVariables, setConfigInputVariables] = useState({});
  const [localMetaOverride, setLocalMetaOverride] = useState(null);
  const overrideObservedAtRef = useRef(null);
  const [deleteScheduleOpen, setDeleteScheduleOpen] = useState(false);

  const { id: userId, permissions: userPermissions } = useSelector(state => state.user);
  const currentProjectName = useSelector(state => state.settings.project.name);
  const toolkitScheduler = useSelector(selectToolkitScheduler);
  const [updateIndexSchedule] = useUpdateIndexScheduleMutation();
  const [deleteIndexSchedule] = useDeleteIndexScheduleMutation();

  const scheduleData = useMemo(() => {
    const schedule =
      toolkitScheduler[indexName]?.schedules?.[userId] ?? toolkitScheduler[indexName]?.schedules?.[-1];
    return schedule ?? {};
  }, [toolkitScheduler, indexName, userId]);

  const runSchema = useGetSelectedToolSchema({
    toolkitType: values.type,
    toolOptionType: selectedSearchTool || IndexesToolsEnum.searchIndexData,
  });

  const adjustedRunSchema = useMemo(() => {
    if (!runSchema) return null;
    return adjustIndexDataSchema(runSchema, { query: { clipboard: true } });
  }, [runSchema]);

  const configSchema = useGetSelectedToolSchema({
    toolkitType: values.type,
    toolOptionType: IndexesToolsEnum.indexData,
  });

  const isRunFormValid = useMemo(() => {
    if (!adjustedRunSchema?.properties) return false;
    return ToolkitChatHelpers.validateToolkitForm(adjustedRunSchema, toolInputVariables);
  }, [adjustedRunSchema, toolInputVariables]);

  const traceNewIndex = useCallback((id, metadata) => {
    if (!metadata) return;
    setHasIndexedThisSession(true);
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
    handleRunTool,
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
    isValidForm: isRunFormValid,
    refetchIndexesList,
    runTool: selectedSearchTool,
    toolkitId,
    toolInputVariables,
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
  const runIsLive = hasLiveRun({
    isIndexing: effectiveIsIndexing,
    canStopIndexing,
    isStale: effectiveStale,
  });
  const deleteDisabled = isDeleting || isAwaitingTaskStart || runIsLive;
  // const canRunTools = selectedSearchTool && RUNNABLE_INDEX_STATUSES.includes(effectiveState);

  const schedulingTooltipMessage = useMemo(() => {
    if (effectiveState === IndexStatuses.cancelled || effectiveState === IndexStatuses.fail)
      return 'Scheduling is unavailable while the index is in a stopped/error state';
    const noPermissions =
      Array.isArray(userPermissions) && !userPermissions.includes(PERMISSIONS.index.schedule);
    if (noPermissions)
      return `Insufficient permissions to perform this action on ${currentProjectName} project`;
    if (scheduleData.enabled) return null;
    if (!RUNNABLE_INDEX_STATUSES.includes(effectiveState) && effectiveState !== IndexStatuses.progress)
      return 'Index state is not valid';
    return null;
  }, [effectiveState, userPermissions, scheduleData.enabled, currentProjectName]);

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
    try {
      return cronstrue.toString(cron, { use24HourTimeFormat: true });
    } catch {
      return cron;
    }
  }, [scheduleData.cron]);

  const scheduleTimezoneHint = useMemo(() => {
    const scheduleTz = scheduleData.timezone;

    if (!scheduleTz) return null;

    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (scheduleTz === browserTz) return null;
      return `Scheduled: ${scheduleTz}\nShown: ${browserTz}`;
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

  const onChangeInputVariables = useCallback(value => setToolInputVariables(value), []);

  const handleChangeTab = useCallback((_event, value) => setActiveTab(value), []);

  const handleSelectSearchTool = useCallback(tool => {
    if (!tool) setHasSearchResults(false);
    setSelectedSearchTool(tool);
  }, []);

  const handleRunSearch = useCallback(() => {
    setHasSearchResults(true);
    handleRunTool();
  }, [handleRunTool]);

  const handleReindex = useCallback(() => setReindexConfirmOpen(true), []);
  const confirmReindex = useCallback(() => {
    setReindexConfirmOpen(false);
    setHasSearchResults(false);
    handleClearActiveConversation();
    handleClearChat();
    handleIndexData();
  }, [handleClearActiveConversation, handleClearChat, handleIndexData]);
  const cancelReindexConfirm = useCallback(() => setReindexConfirmOpen(false), []);

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

  useEffect(() => {
    if (!configSchema?.properties) return;
    setConfigInputVariables(prev => ({ ...configuredValues, ...prev }));
  }, [configSchema, configuredValues]);

  const runFormFields = useMemo(() => Object.keys(adjustedRunSchema?.properties || {}), [adjustedRunSchema]);
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
  const banner = useMemo(
    () => bannerVariant(effectiveIsIndexing, effectiveState, reindexStats, index?.metadata?.error),
    [effectiveIsIndexing, effectiveState, reindexStats, index?.metadata?.error],
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

  const accordionSections = [
    {
      key: 'general',
      title: 'General',
      content: (
        <RunIndexGeneralSection
          index={index}
          reindexStats={reindexStats}
          isRunning={isRunning}
          isIndexing={effectiveIsIndexing}
          isStale={effectiveStale}
          isWaitingForTaskStart={isAwaitingTaskStart}
          canStopIndexing={canStopIndexing}
          isDeleting={isDeleting}
          onReindex={handleReindex}
          onOpenDelete={openDelete}
        />
      ),
      defaultExpanded: true,
    },
    {
      key: 'schedule',
      title: 'Schedule',
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
      defaultExpanded: false,
    },
  ];
  const chatConversation = useMemo(
    () => getMockToolkitIndexConversation(chatHistory?.filter(msg => msg.id !== WELCOME_MESSAGE_ID)),
    [chatHistory],
  );
  const questionItemRef = useRef();

  const historyDisabled = !index?.metadata?.history?.length || effectiveIsIndexing;
  const historyTooltip = effectiveIsIndexing
    ? 'Unavailable while indexing is in progress'
    : historyDisabled
      ? 'No history available'
      : 'View index history';

  const isConfigurationTab = activeTab === IndexDetailsTabs.configuration;
  const isActivityTab = activeTab === IndexDetailsTabs.activity;

  const showSearchResults = (isRunning && Boolean(selectedSearchTool)) || hasSearchResults;
  const showIndexingResults =
    (isRunning && !selectedSearchTool) ||
    effectiveIsIndexing ||
    (banner.severity !== BannerSeverity.success && chatConversation?.chat_history?.length > 0);

  const goToHistory = useCallback(() => {
    const target = RouteDefinitions.ToolkitIndexHistory.replace(':tab', tab ?? 'all')
      .replace(':toolkitId', String(toolkitId))
      .replace(':indexName', encodeURIComponent(indexName));
    navigate(target);
  }, [navigate, tab, toolkitId, indexName]);

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
          />
          <Box
            data-testid="run-index-accordions"
            sx={styles.accordionWrapper}
          >
            {accordionSections.map(section => (
              <BasicAccordion
                key={section.key}
                accordionSX={styles.accordion}
                items={[
                  {
                    title: section.title,
                    content: section.content,
                    summaryAction: section.summaryAction,
                  },
                ]}
                defaultExpanded={section.defaultExpanded}
              />
            ))}
          </Box>
        </Box>

        <Box sx={styles.rightColumn}>
          <IndexDetailsTabsBand
            activeTab={activeTab}
            onChangeTab={handleChangeTab}
          />
          <Box sx={styles.tabBody}>
            {isConfigurationTab && (
              <IndexConfigurationTab
                configFields={configFields}
                configSchema={configSchema}
                configInputVariables={configInputVariables}
                onChangeInputVariables={setConfigInputVariables}
                disabled={isRunning || effectiveIsIndexing}
              />
            )}
            {isActivityTab && banner.severity === BannerSeverity.success && (
              <IndexSuccess
                banner={banner}
                onSelectSearchTool={handleSelectSearchTool}
                selectedSearchTool={selectedSearchTool}
                selectedIndexTools={selectedIndexTools}
                runFormFields={runFormFields}
                adjustedRunSchema={adjustedRunSchema}
                toolInputVariables={toolInputVariables}
                onChangeInputVariables={onChangeInputVariables}
                isRunning={isRunning}
                effectiveIsIndexing={effectiveIsIndexing}
                handleRunTool={handleRunSearch}
                chatHistory={chatHistory}
                chatConversation={chatConversation}
                questionItemRef={questionItemRef}
                isRunFormValid={isRunFormValid}
                showResults={showSearchResults}
                showBanner={hasIndexedThisSession}
              />
            )}
            {isActivityTab && banner.severity !== BannerSeverity.success && (
              <IndexError
                banner={banner}
                isIndexing={effectiveIsIndexing}
                isStoppingIndexing={isStoppingIndexing}
                canStopIndexing={canStopIndexing}
                onStop={onCancelIndexing}
                chatHistory={chatHistory}
                chatConversation={chatConversation}
                questionItemRef={questionItemRef}
                showResults={showIndexingResults}
              />
            )}
          </Box>
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
    background: ({ palette }) => palette.background.toolkitDetailLeftPanel,
  },
  accordionWrapper: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '0.5rem 1.5rem 1rem 1.5rem',
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
    gap: '0.75rem',
  },
  rightContent: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    alignItems: 'center',
  },
  rightFooter: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '0.5rem',
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  footerRunSlot: {
    width: '100%',
    maxWidth: '48rem',
    display: 'flex',
    justifyContent: 'center',
  },
  footerClearSlot: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
  },
  readyRow: {
    width: '100%',
    maxWidth: '48rem',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '0.25rem',
    alignSelf: 'center',
  },
  readyRowInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default RunIndexPanel;
