import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import cronstrue from 'cronstrue';
import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, Tooltip, Typography } from '@mui/material';

import {
  useDeleteIndexItemMutation,
  useUpdateIndexScheduleMutation,
} from '@/[fsd]/features/toolkits/indexes/api';
import {
  BannerSeverity,
  IndexCronDefault,
  IndexStatuses,
  IndexesToolsEnum,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  adjustIndexDataSchema,
  getMockToolkitIndexConversation,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { bannerVariant } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { selectToolkitScheduler } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { IndexError, IndexScheduleModal, IndexSuccess } from '@/[fsd]/features/toolkits/indexes/ui';
import { ToolkitChatHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useGetCurrentToolkitSchemas, useToolkitChat } from '@/[fsd]/features/toolkits/lib/hooks';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import ClockIcon from '@/assets/clock.svg?react';
import { PERMISSIONS } from '@/common/constants';
import { convertToolkitSchema } from '@/common/toolkitSchemaUtils';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import RouteDefinitions from '@/routes';

import RunIndexConfigSection from './RunIndexConfigSection';
import RunIndexGeneralSection from './RunIndexGeneralSection';
import RunIndexScheduleAction from './RunIndexScheduleAction';
import RunIndexScheduleContent from './RunIndexScheduleContent';

const RunIndexPanel = memo(props => {
  const { toolkitId, indexName, index, refetchIndexesList, selectedIndexTools, tab, initialConversation } =
    props;
  const styles = runIndexPanelStyles();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError } = useToast();
  const { values } = useFormikContext();

  const [selectedSearchTool, setSelectedSearchTool] = useState(null);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const [hasIndexedThisSession, setHasIndexedThisSession] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reindexConfirmOpen, setReindexConfirmOpen] = useState(false);
  const [toolInputVariables, setToolInputVariables] = useState({});
  const [configInputVariables, setConfigInputVariables] = useState({});
  const [localMetaOverride, setLocalMetaOverride] = useState(null);

  const { id: userId, permissions: userPermissions } = useSelector(state => state.user);
  const currentProjectName = useSelector(state => state.settings.project.name);
  const toolkitScheduler = useSelector(selectToolkitScheduler);
  const [updateIndexSchedule] = useUpdateIndexScheduleMutation();

  const scheduleData = useMemo(() => {
    const schedule =
      toolkitScheduler[indexName]?.schedules?.[userId] ?? toolkitScheduler[indexName]?.schedules?.[-1];
    return schedule ?? { cron: IndexCronDefault, enabled: false, credentials: null };
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
    setLocalMetaOverride(prev => ({ ...(prev || {}), ...metadata }));
  }, []);
  const {
    chatHistory,
    isIndexing,
    isRunning,
    isStoppingIndexing,
    handleClearChat,
    handleClearActiveConversation,
    handleIndexData,
    handleRunTool,
    onCancelIndexing,
  } = useToolkitChat({
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
  });

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
  const banner = useMemo(
    () => bannerVariant(effectiveIsIndexing, effectiveState),
    [effectiveIsIndexing, effectiveState],
  );
  // const canRunTools = selectedSearchTool && RUNNABLE_INDEX_STATUSES.includes(effectiveState);

  const showSearchResults = (isRunning && Boolean(selectedSearchTool)) || hasSearchResults;
  const showIndexingResults = (isRunning && !selectedSearchTool) || effectiveIsIndexing;

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

  const handleChangeIndexSchedule = useCallback(
    async (data, notification) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      try {
        await updateIndexSchedule({
          projectId,
          toolkitId,
          indexName,
          timezone,
          ...data,
        }).unwrap();
        if (notification) toastSuccess(`Schedule is ${data.enabled ? 'enabled' : 'disabled'} for index!`);
      } catch {
        if (notification)
          toastError(
            `An error occurred while ${data.enabled ? 'enabling' : 'disabling'} schedule for index!`,
          );
      }
    },
    [updateIndexSchedule, projectId, toolkitId, indexName, toastSuccess, toastError],
  );

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const scheduleSummary = useMemo(() => {
    if (!scheduleData.enabled) return null;
    const cron = scheduleData.cron || IndexCronDefault;
    try {
      return cronstrue.toString(cron, { use24HourTimeFormat: true });
    } catch {
      return cron;
    }
  }, [scheduleData.enabled, scheduleData.cron]);

  const handleApplyScheduleModal = useCallback(
    (cron, credentials) => {
      handleChangeIndexSchedule({ ...scheduleData, cron, credentials, enabled: true }, true);
    },
    [scheduleData, handleChangeIndexSchedule],
  );

  useEffect(() => {
    if (!localMetaOverride) return;
    if (index?.metadata?.state === localMetaOverride.state) setLocalMetaOverride(null);
  }, [index?.metadata?.state, localMetaOverride]);

  const onChangeInputVariables = useCallback(value => setToolInputVariables(value), []);

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
      toastSuccess('Index deleted successfully');
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
    if (!md) return { isReindex: false, updatedOn: null, updated: null, skipped: 0 };

    const completedRuns = Array.isArray(md.history)
      ? md.history.filter(h => h?.state === 'completed').length
      : 0;
    const isReindex = completedRuns > 1;

    let skipped = 0;
    try {
      const parsed = typeof md.skipped === 'string' ? JSON.parse(md.skipped) : md.skipped;
      skipped = Number(parsed?.total_skipped ?? 0) || 0;
    } catch {
      skipped = 0;
    }

    return {
      isReindex,
      updatedOn: md.updated_on ?? null,
      updated: md.updated ?? null,
      skipped,
    };
  }, [index?.metadata]);

  const accordionSections = [
    {
      key: 'general',
      title: 'General',
      content: (
        <RunIndexGeneralSection
          indexName={indexName}
          index={index}
          reindexStats={reindexStats}
          isRunning={isRunning}
          isIndexing={effectiveIsIndexing}
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
          credentialsTitle={scheduleData.credentials?.elitea_title}
        />
      ),
      summaryAction: (
        <RunIndexScheduleAction
          enabled={scheduleData.enabled}
          disabledReason={schedulingTooltipMessage}
          onConfigure={() => setScheduleModalOpen(true)}
          onToggle={() =>
            handleChangeIndexSchedule({ ...scheduleData, enabled: !scheduleData.enabled }, true)
          }
        />
      ),
      defaultExpanded: false,
    },
    {
      key: 'index-configuration',
      title: 'Index configuration',
      content: (
        <RunIndexConfigSection
          configFields={configFields}
          configSchema={configSchema}
          configInputVariables={configInputVariables}
          onChangeInputVariables={setConfigInputVariables}
          disabled={isRunning || effectiveIsIndexing}
        />
      ),
      defaultExpanded: false,
    },
  ];

  const chatConversation = useMemo(() => getMockToolkitIndexConversation(chatHistory), [chatHistory]);
  const questionItemRef = useRef();

  const historyDisabled = !index?.metadata?.history?.length || effectiveIsIndexing;

  const goToHistory = useCallback(() => {
    const target = RouteDefinitions.ToolkitIndexHistory.replace(':tab', tab ?? 'all')
      .replace(':toolkitId', String(toolkitId))
      .replace(':indexName', encodeURIComponent(indexName));
    navigate(target);
  }, [navigate, tab, toolkitId, indexName]);

  return (
    <Box sx={styles.body}>
      <Box sx={styles.leftColumn}>
        <Box sx={styles.leftHeader}>
          <Tooltip title={historyDisabled ? 'No history available' : 'View index history'}>
            <Box component="span">
              <Button.BaseBtn
                variant={Button.BUTTON_VARIANTS.iconLabel}
                size="small"
                disabled={historyDisabled}
                onClick={goToHistory}
                startIcon={<ClockIcon />}
              >
                History
              </Button.BaseBtn>
            </Box>
          </Tooltip>
        </Box>
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
        {banner.severity === BannerSeverity.success && (
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
        {banner.severity !== BannerSeverity.success && (
          <IndexError
            banner={banner}
            isIndexing={effectiveIsIndexing}
            isStoppingIndexing={isStoppingIndexing}
            onStop={onCancelIndexing}
            chatHistory={chatHistory}
            chatConversation={chatConversation}
            questionItemRef={questionItemRef}
            showResults={showIndexingResults}
          />
        )}
      </Box>

      <Modal.DeleteEntityModal
        name={index?.metadata?.collection || indexName}
        shouldRequestInputName
        open={deleteOpen}
        onClose={closeDelete}
        onConfirm={confirmDelete}
      />
      <Modal.BaseModal
        variant="simple"
        open={reindexConfirmOpen}
        title={`Reindex ${indexName}?`}
        content={<Typography variant="bodyMedium">This will replace the current index data.</Typography>}
        confirmButtonText="Reindex"
        cancelButtonText="Cancel"
        onClose={cancelReindexConfirm}
        onConfirm={confirmReindex}
      />
      <IndexScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSubmit={handleApplyScheduleModal}
        cron={scheduleData.cron}
        credentials={scheduleData.credentials}
        credentialsData={credentialsData}
      />
    </Box>
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
    maxWidth: '37.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minHeight: 0,
    padding: '0.5rem 1.5rem 1rem 1.5rem',
    borderRight: ({ palette }) => `1px solid ${palette.border.table}`,
    position: 'relative',
    background: ({ palette }) => palette.background.toolkitDetailLeftPanel,
  },
  leftHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    position: 'absolute',
    top: '1rem',
    right: '1.5rem',
    zIndex: 999,
  },
  accordion: {
    background: ({ palette }) => palette.background.toolkitDetailLeftPanel,
  },
  accordionWrapper: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    gap: '0.75rem',
    minHeight: 0,
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
