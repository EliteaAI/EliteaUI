import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Button as MuiButton, Switch, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import {
  EditViewTabsEnum,
  IndexCronDefault,
  IndexStatuses,
  IndexViewsEnum,
  IndexesToolsEnum,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  selectHistoryItem,
  selectToolkitScheduler,
} from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { IndexScheduleModal } from '@/[fsd]/features/toolkits/indexes/ui';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { useUpdateIndexScheduleMutation } from '@/api';
import { PERMISSIONS } from '@/common/constants';
import { convertToolkitSchema } from '@/common/toolkitSchemaUtils';
import GearIcon from '@/components/Icons/GearIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const IndexActions = memo(props => {
  const {
    activeView,
    index,
    view,
    toolkitId,
    onDiscard,
    isValidForm,
    indexData,
    isIndexingData,
    isRunningTool,
    handleDeleteIndex,
    isIndexDeleting,
    selectedIndexTools,
    onCancelIndexing,
    isStoppingIndexing,
    editToolDetail,
  } = props;
  const styles = indexActionsStyles();
  const { toastSuccess, toastError } = useToast();

  const { id: userId, permissions: userPermissions } = useSelector(state => state.user);
  const projectId = useSelectedProjectId();

  const currentProjectName = useSelector(state => state.settings.project.name);
  const toolkitScheduler = useSelector(selectToolkitScheduler);
  const selectedHistoryItem = useSelector(selectHistoryItem);

  const indexName = index?.metadata?.collection ?? null;
  const indexCouldBeStopped = Boolean(index?.metadata?.task_id);
  const progressInvalidIndex = index?.stale && index?.metadata?.state === IndexStatuses.progress;

  const [updateIndexSchedule] = useUpdateIndexScheduleMutation();

  const [scheduleModal, setScheduleModal] = useState(false);

  const isEditMode = view === IndexViewsEnum.edit;
  const isActionsDisabled = isRunningTool || isIndexDeleting;
  const isRemovingDisabled = !selectedIndexTools.includes(IndexesToolsEnum.removeIndex);
  const isReindexDisabled = selectedHistoryItem || activeView === EditViewTabsEnum.run;

  const scheduleData = useMemo(() => {
    const schedule =
      toolkitScheduler[indexName]?.schedules?.[userId] ?? toolkitScheduler[indexName]?.schedules?.[-1];
    return schedule ?? { cron: IndexCronDefault, enabled: false, credentials: null };
  }, [toolkitScheduler, indexName, userId]);

  const { toolkitSchemas, isFetching: toolkitSchemaFetching } = useGetCurrentToolkitSchemas({ isMCP: false });

  const toolkitType = useMemo(() => {
    return editToolDetail?.type || '';
  }, [editToolDetail?.type]);

  const toolkitSchema = useMemo(() => {
    return editToolDetail?.schema || convertToolkitSchema(toolkitSchemas?.[toolkitType]);
  }, [editToolDetail?.schema, toolkitSchemas, toolkitType]);

  // eslint-disable-next-line no-unused-vars
  const [_, credentialsData] = useMemo(
    () =>
      Object.entries(toolkitSchema?.properties || {}).find(
        // eslint-disable-next-line no-unused-vars
        ([__, v]) => v.section?.includes('credentials') ?? null,
      ) ?? [null, null],
    [toolkitSchema],
  );

  const schedulingTooltipMessage = useMemo(() => {
    const noPermissions =
      Array.isArray(userPermissions) && !userPermissions.includes(PERMISSIONS.index.schedule);

    if (noPermissions)
      return `Insufficient permissions to perform this action on ${currentProjectName} project`;
    if (scheduleData.enabled) return null;

    if (isReindexDisabled) return 'Go to "Configuration" tab to configure scheduling';
    if (
      !RUNNABLE_INDEX_STATUSES.includes(index?.metadata?.state) &&
      index?.metadata?.state !== IndexStatuses.progress
    )
      return 'Index state is not valid';
    if (!scheduleData?.credentials && credentialsData) return 'Set credentials to enable scheduling';

    return null;
  }, [
    userPermissions,
    scheduleData.enabled,
    scheduleData?.credentials,
    isReindexDisabled,
    index?.metadata?.state,
    credentialsData,
    currentProjectName,
  ]);

  const scheduleConfigMessage = useMemo(
    () =>
      schedulingTooltipMessage === 'Set credentials to enable scheduling' ? null : schedulingTooltipMessage,
    [schedulingTooltipMessage],
  );

  const handleChangeIndexSchedule = useCallback(
    async (data, notificatino) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      try {
        await updateIndexSchedule({
          projectId,
          toolkitId,
          indexName,
          timezone,
          ...data,
        }).unwrap();
        if (notificatino) toastSuccess(`Schedule is ${data.enabled ? 'enabled' : 'disabled'} for index!`);
      } catch {
        if (notificatino)
          toastError(
            `An error occurred while ${data.enabled ? 'enabling' : 'disabling'} schedule for index!`,
          );
      }
    },
    [updateIndexSchedule, projectId, toolkitId, indexName, toastSuccess, toastError],
  );

  const onScheduleModalSubmit = useCallback(
    (cronExpression, credentials) =>
      handleChangeIndexSchedule({ ...scheduleData, cron: cronExpression, credentials }),
    [handleChangeIndexSchedule, scheduleData],
  );

  const RemoveButton = () => (
    <Tooltip
      title={isRemovingDisabled ? '"Remove index" tool is not selected' : null}
      placement="top"
    >
      <Box component="span">
        <MuiButton
          sx={styles.indexButton}
          variant="alita"
          color="secondary"
          onClick={handleDeleteIndex}
          disabled={isActionsDisabled || isRemovingDisabled}
        >
          Delete
        </MuiButton>
      </Box>
    </Tooltip>
  );

  if (isIndexingData)
    return indexCouldBeStopped || progressInvalidIndex ? (
      <Button.DiscardButton
        title="Stop"
        alertContent="Are you sure to stop the indexing process?"
        onDiscard={onCancelIndexing}
        executing={isStoppingIndexing}
        color="alarm"
      />
    ) : (
      <RemoveButton />
    );

  return (
    <>
      <Box sx={styles.wrapper}>
        {isEditMode ? (
          <>
            <Box sx={styles.switchWrapper}>
              <Tooltip
                title={schedulingTooltipMessage}
                placement="top"
                slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -8] } }] } }}
              >
                <Box component="span">
                  <Switch
                    checked={scheduleData.enabled}
                    onChange={() =>
                      handleChangeIndexSchedule({ ...scheduleData, enabled: !scheduleData.enabled }, true)
                    }
                    disabled={Boolean(schedulingTooltipMessage)}
                    size="small"
                    variant="alita"
                  />
                </Box>
              </Tooltip>

              <Typography
                variant="bodyM"
                color="text.secondary"
                sx={{ fontSize: '0.875rem' }}
              >
                Schedule
              </Typography>

              <Tooltip
                title={scheduleConfigMessage}
                placement="top"
                slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -8] } }] } }}
              >
                <Box
                  sx={[styles.iconWrapper, scheduleConfigMessage ? styles.iconWrapperDisabled : {}]}
                  onClick={() => (scheduleConfigMessage ? null : setScheduleModal(true))}
                >
                  <GearIcon />
                </Box>
              </Tooltip>
            </Box>
            <Tooltip
              title={isReindexDisabled ? 'Go to "Configuration" tab to reindex' : null}
              placement="top"
            >
              <Box component="span">
                <MuiButton
                  sx={styles.indexButton}
                  variant="alita"
                  color="secondary"
                  onClick={indexData}
                  disabled={Boolean(isActionsDisabled || isReindexDisabled)}
                >
                  Reindex
                </MuiButton>
              </Box>
            </Tooltip>

            <RemoveButton />
          </>
        ) : (
          <>
            <Button.DiscardButton
              title="Cancel"
              onDiscard={onDiscard}
              disabled={isRunningTool}
            />
            <MuiButton
              sx={styles.indexButton}
              disabled={!isValidForm || isRunningTool}
              variant="alita"
              color="primary"
              onClick={indexData}
            >
              Index
            </MuiButton>
          </>
        )}
      </Box>
      <IndexScheduleModal
        cron={scheduleData.cron}
        credentials={scheduleData.credentials}
        open={scheduleModal}
        onClose={() => setScheduleModal(false)}
        onSubmit={onScheduleModalSubmit}
        editToolDetail={editToolDetail}
        toolkitSchemaFetching={toolkitSchemaFetching}
        credentialsData={credentialsData}
      />
    </>
  );
});

IndexActions.displayName = 'IndexActions';

/** @type {MuiSx} */
const indexActionsStyles = () => ({
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '.75rem',
  },
  switchWrapper: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '.5rem',
    padding: '0 .75rem',
    borderRight: `1px solid ${palette.divider}`,
  }),
  iconWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '50%',

    svg: {
      width: '1rem',
      height: '1rem',
    },

    '&:hover': {
      cursor: 'pointer',
      backgroundColor: ({ palette }) => palette.background.userInputBackgroundActive,

      svg: {
        color: ({ palette }) => palette.icon.fill.secondary,
      },
    },
  },
  iconWrapperDisabled: {
    cursor: 'default',
    opacity: 0.5,

    '&:hover': {
      cursor: 'default',
      backgroundColor: 'transparent',

      svg: {
        color: 'currentColor',
      },
    },
  },
  indexButton: {
    position: 'relative',
    minWidth: '4.875rem',
  },
});

export default IndexActions;
