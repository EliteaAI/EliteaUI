import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import cronstrue from 'cronstrue';
import { Formik, useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';

import { ChatButton } from '@/[fsd]/features/chat/ui';
import { ChatMessageList } from '@/[fsd]/features/chat/ui/chat-box';
import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import {
  useDeleteIndexItemMutation,
  useGetIndexScheduleQuery,
  useGetIndexesListQuery,
  useUpdateIndexScheduleMutation,
} from '@/[fsd]/features/toolkits/indexes/api';
import {
  IndexCronDefault,
  IndexStatuses,
  IndexesToolsEnum,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  adjustIndexDataSchema,
  getMockToolkitIndexConversation,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import {
  selectIndexesList,
  selectToolkitScheduler,
} from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { IndexScheduleModal } from '@/[fsd]/features/toolkits/indexes/ui';
import { ToolkitChatHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useGetCurrentToolkitSchemas, useToolkitChat } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { Button as EliteaButton, Modal, Select, Switch } from '@/[fsd]/shared/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { PERMISSIONS } from '@/common/constants';
import { convertToolkitSchema } from '@/common/toolkitSchemaUtils';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import RocketIcon from '@/components/Icons/RocketIcon';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import Page404 from '@/pages/Page404.jsx';
import IndexBreadcrumb from '@/pages/Toolkits/IndexBreadcrumb';
import RouteDefinitions from '@/routes';

const emptyToolDetail = {};
const RIGHT_TAB_RUN_SETTINGS = 'runSettings';
const RIGHT_TAB_RESULTS = 'results';

const formatDate = ts => {
  if (!ts) return '—';
  try {
    const d = new Date(typeof ts === 'number' ? ts * 1000 : ts);

    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  } catch {
    return '—';
  }
};

const bannerVariant = (isRunningTool, isIndexing, state) => {
  if (isIndexing) return { severity: 'warning', label: 'Indexing in progress…' };
  if (state === IndexStatuses.progress) return { severity: 'warning', label: 'Indexing in progress…' };
  if (state === IndexStatuses.fail) return { severity: 'error', label: 'Indexing failed' };
  if (state === IndexStatuses.cancelled) return { severity: 'info', label: 'Indexing stopped' };
  if (RUNNABLE_INDEX_STATUSES.includes(state)) return { severity: 'success', label: 'Index is ready!' };
  return { severity: 'info', label: 'Preparing…' };
};

const RunIndexPanel = memo(props => {
  const { toolkitId, indexName, index, refetchIndexesList, selectedIndexTools, tab } = props;
  const styles = runIndexStyles();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError } = useToast();
  const { values } = useFormikContext();

  const runToolOptions = useMemo(
    () =>
      [
        { label: 'Search Index', value: IndexesToolsEnum.searchIndexData },
        { label: 'Stepback Search Index', value: IndexesToolsEnum.stepbackSearchIndex },
        { label: 'Stepback Summary Index', value: IndexesToolsEnum.stepbackSummaryIndex },
      ].filter(opt => (selectedIndexTools || []).includes(opt.value)),
    [selectedIndexTools],
  );

  const [selectedRunTool, setSelectedRunTool] = useState(runToolOptions[0]?.value ?? null);
  const [activeRightTab, setActiveRightTab] = useState(RIGHT_TAB_RUN_SETTINGS);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reindexConfirmOpen, setReindexConfirmOpen] = useState(false);
  const [toolInputVariables, setToolInputVariables] = useState({});
  const [configInputVariables, setConfigInputVariables] = useState({});
  const [localMetaOverride, setLocalMetaOverride] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

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
    toolOptionType: selectedRunTool || IndexesToolsEnum.searchIndexData,
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
    setBannerDismissed(false);
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
    runTool: selectedRunTool,
    toolkitId,
    toolInputVariables,
    traceNewIndex,
    values,
    modes: [],
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
  const banner = useMemo(
    () => bannerVariant(isRunning, isIndexing, effectiveState),
    [isRunning, isIndexing, effectiveState],
  );
  const canRunTools = selectedRunTool && RUNNABLE_INDEX_STATUSES.includes(effectiveState);

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

  const handleReindex = useCallback(() => setReindexConfirmOpen(true), []);
  const confirmReindex = useCallback(() => {
    setReindexConfirmOpen(false);
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

  const generalAccordionContent = (
    <Box sx={styles.generalGrid}>
      <Box sx={styles.generalRow}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Name
        </Typography>
        <Typography variant="bodyMedium">{indexName}</Typography>
      </Box>
      <Box sx={styles.generalRow}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Created
        </Typography>
        <Typography variant="bodyMedium">{formatDate(index?.metadata?.created_on)}</Typography>
      </Box>
      <Box sx={styles.generalRow}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Files indexed
        </Typography>
        <Typography variant="bodyMedium">
          {index?.metadata?.total ?? index?.metadata?.indexed ?? '—'}
        </Typography>
      </Box>
      {reindexStats.isReindex && (
        <Box sx={styles.generalRow}>
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Last reindex
          </Typography>
          <Typography variant="bodyMedium">{formatDate(reindexStats.updatedOn)}</Typography>
        </Box>
      )}
      {reindexStats.isReindex && reindexStats.updated !== null && (
        <Box sx={styles.generalRow}>
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Files reindexed
          </Typography>
          <Typography variant="bodyMedium">{reindexStats.updated}</Typography>
        </Box>
      )}
      {reindexStats.skipped > 0 && (
        <Box sx={styles.generalRow}>
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Files skipped
          </Typography>
          <Typography variant="bodyMedium">{reindexStats.skipped}</Typography>
        </Box>
      )}
      <Box sx={styles.generalActions}>
        <Button
          variant="special"
          onClick={handleReindex}
          disabled={isRunning || isIndexing}
        >
          Reindex
        </Button>
        <Button
          variant="secondary"
          onClick={openDelete}
          disabled={isDeleting || isIndexing}
        >
          Delete Index
        </Button>
      </Box>
    </Box>
  );

  const scheduleAccordionContent = !scheduleData.enabled ? (
    <Box sx={styles.placeholderBlock}>
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        No schedule configured
      </Typography>
    </Box>
  ) : (
    <Box sx={styles.scheduleSummaryBlock}>
      <Typography variant="bodyMedium">{scheduleSummary}</Typography>
      {scheduleData.credentials?.elitea_title && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          Credentials: {scheduleData.credentials.elitea_title}
        </Typography>
      )}
    </Box>
  );

  const scheduleSummaryAction = (
    <Box sx={styles.scheduleSummaryActions}>
      <Tooltip
        title={scheduleData.enabled ? 'Configure schedule' : ''}
        placement="top"
      >
        <Box component="span">
          <IconButton
            size="small"
            disabled={!scheduleData.enabled || Boolean(schedulingTooltipMessage)}
            onClick={e => {
              e.stopPropagation();
              setScheduleModalOpen(true);
            }}
          >
            <SettingsOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
      <Tooltip
        title={schedulingTooltipMessage || ''}
        placement="top"
      >
        <Box component="span">
          <Switch.BaseSwitch
            checked={scheduleData.enabled}
            onChange={() =>
              handleChangeIndexSchedule({ ...scheduleData, enabled: !scheduleData.enabled }, true)
            }
            disabled={Boolean(schedulingTooltipMessage)}
          />
        </Box>
      </Tooltip>
    </Box>
  );

  const configAccordionContent =
    configFields.length === 0 ? (
      <Box sx={styles.loadingRow}>
        <CircularProgress size={20} />
      </Box>
    ) : (
      <Box sx={styles.configEditor}>
        {configFields.map(key => (
          <ToolkitForm.ToolFormContainer
            key={key}
            fieldKey={key}
            property={configSchema.properties[key]}
            toolInputVariables={configInputVariables}
            schema={configSchema}
            onChangeInputVariables={setConfigInputVariables}
            changesDisabled={isRunning || isIndexing || key === 'index_name'}
          />
        ))}
      </Box>
    );

  const accordionSections = [
    { key: 'general', title: 'General', content: generalAccordionContent, defaultExpanded: true },
    {
      key: 'schedule',
      title: 'Schedule',
      content: scheduleAccordionContent,
      summaryAction: scheduleSummaryAction,
      defaultExpanded: false,
    },
    {
      key: 'index-configuration',
      title: 'Index configuration',
      content: configAccordionContent,
      defaultExpanded: false,
    },
  ];

  const chatConversation = useMemo(() => getMockToolkitIndexConversation(chatHistory), [chatHistory]);
  const questionItemRef = useRef();

  const canDismissBanner = banner.severity === 'success' || banner.severity === 'info';
  const rightBanner =
    bannerDismissed && canDismissBanner ? null : (
      <Alert
        severity={banner.severity}
        variant="outlined"
        onClose={canDismissBanner ? () => setBannerDismissed(true) : undefined}
        sx={styles.banner}
        action={
          isIndexing ? (
            <EliteaButton.DiscardButton
              title={isStoppingIndexing ? 'Stopping…' : 'Stop'}
              alertContent="Are you sure you want to stop indexing?"
              onDiscard={onCancelIndexing}
              disabled={isStoppingIndexing}
              discarding={isStoppingIndexing}
            />
          ) : null
        }
      >
        {banner.label}
      </Alert>
    );

  const runSettings = (
    <Box sx={styles.runSettings}>
      {runToolOptions.length === 0 ? (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          No run tools are enabled for this toolkit.
        </Typography>
      ) : (
        <>
          <Select.SingleSelect
            label="Tool"
            value={selectedRunTool ?? ''}
            onValueChange={value => setSelectedRunTool(value || null)}
            options={runToolOptions}
            showBorder
          />
          {runFormFields.map(key => (
            <ToolkitForm.ToolFormContainer
              key={key}
              fieldKey={key}
              property={adjustedRunSchema.properties[key]}
              toolInputVariables={toolInputVariables}
              schema={adjustedRunSchema}
              onChangeInputVariables={onChangeInputVariables}
              changesDisabled={isRunning || isIndexing}
            />
          ))}
        </>
      )}
    </Box>
  );

  const resultsPanel = (
    <ChatBodyContainer sx={styles.chatBody}>
      <ChatMessageList
        chat_history={chatHistory}
        activeConversation={chatConversation}
        isLoading={false}
        isStreaming={false}
        isLoadingMore={false}
        interaction_uuid="toolkit-test"
        askingQuestionId=""
        lastResponseMinHeight={0}
        questionItemRef={questionItemRef}
        onRegenerateAnswer={() => null}
        onCopyToClipboard={() => null}
      />
    </ChatBodyContainer>
  );

  const historyDisabled =
    !index?.metadata?.history?.length || effectiveState === IndexStatuses.progress || isIndexing;

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
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Index details
          </Typography>
          <Tooltip title={historyDisabled ? 'No history available' : 'View index history'}>
            <span>
              <Button
                variant="secondary"
                size="small"
                disabled={historyDisabled}
                onClick={goToHistory}
              >
                History
              </Button>
            </span>
          </Tooltip>
        </Box>
        <Box
          data-testid="run-index-accordions"
          sx={styles.accordionWrapper}
        >
          {accordionSections.map(section => (
            <BasicAccordion
              key={section.key}
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
        {rightBanner}
        <Box sx={styles.rightTabsBar}>
          <Tabs
            value={activeRightTab}
            onChange={(_, v) => setActiveRightTab(v)}
          >
            <Tab
              value={RIGHT_TAB_RUN_SETTINGS}
              label="Run Settings"
            />
            <Tab
              value={RIGHT_TAB_RESULTS}
              label="Results"
            />
          </Tabs>
        </Box>

        <Box sx={styles.rightContent}>
          {activeRightTab === RIGHT_TAB_RUN_SETTINGS ? runSettings : resultsPanel}
        </Box>

        {!canRunTools && !isIndexing && (
          <Box sx={styles.readyRow}>
            <Box sx={styles.readyRowInner}>
              <RocketIcon />
              <Typography
                variant="bodyMedium"
                color="text.secondary"
              >
                Reindex to enable running tools against this index.
              </Typography>
            </Box>
          </Box>
        )}
        <Box sx={styles.rightFooter}>
          <Box sx={styles.footerRunSlot}>
            <Button
              variant="special"
              disabled={!canRunTools || !isRunFormValid || isRunning || isIndexing}
              onClick={() => {
                setActiveRightTab(RIGHT_TAB_RESULTS);
                handleRunTool();
              }}
            >
              Run Test
            </Button>
          </Box>
          {activeRightTab === RIGHT_TAB_RESULTS && (
            <Box sx={styles.footerClearSlot}>
              <ChatButton.ClearChatButton
                disabled={isRunning || isIndexing}
                onClear={handleClearChat}
              />
            </Box>
          )}
        </Box>
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

const CREATING_POLL_INTERVAL_MS = 2000;
const CREATING_POLL_TIMEOUT_MS = 45000;

const RunIndex = memo(() => {
  const { tab, toolkitId, indexName: rawIndexName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const indexName = useMemo(() => (rawIndexName ? decodeURIComponent(rawIndexName) : ''), [rawIndexName]);
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = runIndexStyles();

  const goBackToToolkit = useCallback(() => {
    const target = RouteDefinitions.ToolkitDetail.replace(':tab', tab ?? 'all').replace(
      ':toolkitId',
      String(toolkitId),
    );
    navigate(target);
  }, [navigate, tab, toolkitId]);

  const goToToolkitsList = useCallback(() => {
    navigate(RouteDefinitions.ToolkitsWithTab.replace(':tab', tab ?? 'all'));
  }, [navigate, tab]);

  const {
    data: publicToolkitData = emptyToolDetail,
    isFetching,
    isError,
    error,
    refetch: refetchToolkit,
  } = useToolkitsDetailsQuery({ projectId, toolkitId }, { skip: !projectId || !toolkitId });

  const { refetch: refetchIndexesList } = useGetIndexesListQuery(
    { toolkitId, projectId },
    { skip: !projectId || !toolkitId },
  );

  useGetIndexScheduleQuery(
    { projectId, toolkitId },
    { skip: !projectId || !toolkitId, refetchOnMountOrArgChange: true },
  );

  const {
    data: indexesList,
    isLoading: indexesLoading,
    isFetching: indexesFetching,
    hasData,
  } = useSelector(selectIndexesList);

  const currentIndex = useMemo(() => {
    if (!hasData || !indexName) return null;
    return indexesList.find(idx => idx?.metadata?.collection === indexName) || null;
  }, [indexesList, indexName, hasData]);

  const isCreating = Boolean(location.state?.creating);
  const [awaitingCreation, setAwaitingCreation] = useState(isCreating);

  useEffect(() => {
    if (!awaitingCreation) return undefined;
    if (currentIndex) {
      setAwaitingCreation(false);
      return undefined;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - start > CREATING_POLL_TIMEOUT_MS) {
        setAwaitingCreation(false);
        clearInterval(interval);
        return;
      }
      refetchIndexesList();
    }, CREATING_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [awaitingCreation, currentIndex, refetchIndexesList]);

  const selectedIndexTools = useMemo(
    () => publicToolkitData?.settings?.selected_tools ?? [],
    [publicToolkitData],
  );

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  const initialValues = useMemo(() => {
    if (!publicToolkitData?.id) return {};
    return {
      ...publicToolkitData,
      settings: publicToolkitData.settings || {},
      type: publicToolkitData.type || '',
    };
  }, [publicToolkitData]);

  const handleRefetch = useCallback(async () => {
    await refetchIndexesList();
    await refetchToolkit();
  }, [refetchIndexesList, refetchToolkit]);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) toastError(buildErrorMessage(error));
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  if (shouldShowNotFoundPage) return <Page404 />;

  const isLoading = isFetching || indexesLoading || indexesFetching || !hasData || !publicToolkitData?.id;

  const showCreatingPlaceholder = awaitingCreation && !currentIndex;

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={
          <IndexBreadcrumb
            toolkitName={publicToolkitData?.name || ''}
            current={indexName || 'Index'}
            onToolkitsClick={goToToolkitsList}
            onToolkitClick={goBackToToolkit}
          />
        }
      />
      <Box sx={styles.content}>
        {isLoading || showCreatingPlaceholder ? (
          <Box sx={styles.loading}>
            <CircularProgress size={24} />
            {showCreatingPlaceholder && (
              <Typography
                variant="bodyMedium"
                color="text.secondary"
                sx={{ marginLeft: '0.75rem' }}
              >
                Preparing index &quot;{indexName}&quot;…
              </Typography>
            )}
          </Box>
        ) : !currentIndex ? (
          <Box sx={styles.loading}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              Index &quot;{indexName}&quot; was not found for this toolkit.
            </Typography>
          </Box>
        ) : (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            onSubmit={() => {}}
          >
            <RunIndexPanel
              toolkitId={toolkitId}
              tab={tab}
              indexName={indexName}
              index={currentIndex}
              selectedIndexTools={selectedIndexTools}
              refetchIndexesList={handleRefetch}
            />
          </Formik>
        )}
      </Box>
    </Box>
  );
});

RunIndex.displayName = 'RunIndex';

/** @type {MuiSx} */
const runIndexStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '1rem 1.5rem',
    gap: '1rem',
    overflow: 'hidden',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
  },
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    gap: '1.5rem',
  },
  leftColumn: {
    flex: '0 0 24rem',
    minWidth: '20rem',
    maxWidth: '26rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minHeight: 0,
  },
  leftHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  accordionWrapper: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  generalGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  generalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  generalActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  placeholderBlock: {
    padding: '0.5rem 0',
  },
  scheduleSummaryBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.25rem 0',
  },
  scheduleSummaryActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  loadingRow: {
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem 0',
  },
  configEditor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '48rem',
  },
  rightColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    gap: '0.75rem',
    minHeight: 0,
  },
  banner: {
    alignItems: 'center',
    borderRadius: '0.5rem',
    '& .MuiAlert-message': { flex: 1 },
  },
  rightTabsBar: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: theme => `1px solid ${theme.palette.divider}`,
  },
  rightContent: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  runSettings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
    padding: '0.5rem 0',
    width: '100%',
    maxWidth: '48rem',
  },
  chatBody: {
    flex: 1,
    minHeight: 0,
  },
  rightFooter: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '0.5rem',
    width: '100%',
    position: 'relative',
  },
  footerRunSlot: {
    width: '100%',
    maxWidth: '48rem',
    display: 'flex',
    justifyContent: 'center',
  },
  footerClearSlot: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    marginTop: '0.25rem',
  },
  readyRow: {
    width: '100%',
    maxWidth: '48rem',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '0.25rem',
  },
  readyRowInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default RunIndex;
