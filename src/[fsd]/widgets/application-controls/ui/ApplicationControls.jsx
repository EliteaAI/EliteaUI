import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useLocation, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { COMPARE_ENTITY_TYPES, CompareVersionsModal } from '@/[fsd]/entities/compare-versions';
import { buildScheduleFormLink } from '@/[fsd]/entities/schedule';
import {
  LATEST_VERSION_NAME,
  VersionDelete,
  usePublishApplicationMenu,
  useSetDefaultVersion,
  useUnpublishVersionMenu,
} from '@/[fsd]/entities/version';
import { useCompareAgentVersions } from '@/[fsd]/features/agent/lib/hooks';
import { PinEntityConstants, TourTargetConstants } from '@/[fsd]/shared/lib/constants';
import { useInstructionsInputRefContext } from '@/[fsd]/shared/lib/context';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import {
  useFormDirtyExcluding,
  useIsFromPipelineDetail,
  useIsPipelineLayoutDirty,
  useProjectEntityLink,
  useProjectType,
  useRunHistoryNavigation,
  useSelectedProjectId,
  useViewMode,
} from '@/[fsd]/shared/lib/hooks';
import { Controls } from '@/[fsd]/shared/ui';
import { EvaluateIcon, RunHistoryIcon } from '@/[fsd]/shared/ui/icon';
import { usePin, usePinMenu } from '@/[fsd]/widgets/pin-toggler/lib/hooks';
import { PERMISSIONS, ViewMode } from '@/common/constants';
import { useCopyLinkMenu } from '@/components/CopyLinkToEntityButton.jsx';
import { useForkEntityMenu } from '@/components/Fork/ForkEntityButton';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DifferenceIcon from '@/components/Icons/DifferenceIcon';
import PinIcon from '@/components/Icons/PinIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useDeleteApplicationMenu } from '@/pages/Applications/Components/Applications/DeleteApplicationButton';
import { useExportApplicationMenu } from '@/pages/Applications/Components/Applications/ExportApplicationButton';
import { AuthorsButton } from '@/pages/Common';
import useIsPipelineYamlCodeDirty from '@/pages/Pipelines/useIsPipelineYamlCodeDirty';
import RouteDefinitions from '@/routes';

const { AGENT_TOUR_TARGET_IDS } = TourTargetConstants;

const ApplicationControls = memo(props => {
  const { setBlockNav, onSuccess } = props;
  const styles = applicationControlsStyles();

  const instructionsInputRef = useInstructionsInputRefContext();
  const { checkPermission } = useCheckPermission();
  const { isPrivate } = useProjectType();
  const isFromPipeline = useIsFromPipelineDetail();
  const formik = useFormikContext();
  const viewMode = useViewMode();
  const location = useLocation();
  const { tab, agentId } = useParams();
  const versionDeleteRef = useRef(null);
  const projectId = useSelectedProjectId();
  const [compareVersionsOpen, setCompareVersionsOpen] = useState(false);

  const { values: { id } = {} } = formik;
  const compareEntityType = isFromPipeline ? COMPARE_ENTITY_TYPES.pipeline : COMPARE_ENTITY_TYPES.agent;

  // The same rule as the editor header Save button: Compare uses the saved versions
  const isFormDirty = useFormDirtyExcluding();
  const isYamlCodeDirty = useIsPipelineYamlCodeDirty();
  const isLayoutDirty = useIsPipelineLayoutDirty();
  // Pipelines only (#7324); the agent compare keeps its behavior
  const isEditorDirty = isFromPipeline && (isFormDirty || isYamlCodeDirty || isLayoutDirty);

  const { runHistoryPath } = useRunHistoryNavigation({
    entityId: id,
    historyRoute: isFromPipeline
      ? RouteDefinitions.PipelineRunHistory
      : RouteDefinitions.ApplicationsRunHistory,
  });

  const {
    loadVersions: loadAgentVersions,
    savingLeftKeys,
    savingRightKeys,
    onSaveLeft,
    onSaveRight,
    resetSavingState,
    flushLeftSaves,
  } = useCompareAgentVersions({ projectId, applicationId: id, entityType: compareEntityType });

  const handleCompareVersionsClose = useCallback(() => {
    // A pipeline rebuilds its YAML and flow from the patched cache; the agent instructions field keeps its own value
    const savedFields = flushLeftSaves();
    if (!isFromPipeline && savedFields?.instructions !== undefined) {
      instructionsInputRef.current?.restoreValue(savedFields.instructions);
    }
    setCompareVersionsOpen(false);
  }, [flushLeftSaves, instructionsInputRef, isFromPipeline]);

  const handleOpenSchedule = useCallback(
    scheduleId =>
      navigate(buildScheduleFormLink({ entityType: compareEntityType, entityId: id, tab, scheduleId })),
    [compareEntityType, id, navigate, tab],
  );

  const versionDetails = formik?.values?.version_details;
  const { projectEntityLink } = useProjectEntityLink({
    versionId: versionDetails?.id,
  });

  const {
    isPinned,
    togglePin,
    isLoading: isPinLoading,
  } = usePin({
    entityId: id,
    entityType: PinEntityConstants.PinEntityType.Application,
    formikContext: formik,
  });

  const { copyLinkMenuItem: shareVersionMenuItem } = useCopyLinkMenu({
    key: 'share-version',
    label: 'Share',
    link: projectEntityLink,
  });
  const { copyLinkMenuItem: shareAgentMenuItem } = useCopyLinkMenu({
    key: 'share-agent',
    label: 'Share',
  });
  const { pinMenuItem } = usePinMenu({
    isPinned,
    onTogglePin: togglePin,
    isLoading: isPinLoading,
    // ELITEA-2049 — thread a caller-supplied key so this menu item renders
    // a data-testid (DotMenu.jsx: `testId: item.key`). Scoped to THIS call
    // site only; the other usePinMenu() callers (Skill/Toolkits/Credentials
    // controls) are untouched (out of this test's scope).
    key: isFromPipeline ? 'pipeline-actions-pin-to-top' : 'agent-actions-pin-to-top',
  });
  const { exportApplicationMenuItem } = useExportApplicationMenu();
  const { forkEntityMenuItem } = useForkEntityMenu({
    id,
    entity_name: !isFromPipeline ? 'applications' : 'pipelines',
  });
  const { deleteApplicationMenuItem } = useDeleteApplicationMenu(setBlockNav);
  const { publishApplicationMenuItem, publishDialog } = usePublishApplicationMenu(onSuccess);
  const { unpublishVersionMenuItem, unpublishDialog } = useUnpublishVersionMenu(onSuccess);
  const { isSettingDefaultVersion, handleSetDefaultVersion, setDefaultVersionDialog } =
    useSetDefaultVersion(onSuccess);

  const disableSetAsDefault = useMemo(() => {
    if (
      formik?.values?.meta?.default_version_id === formik?.values?.version_details?.id ||
      isSettingDefaultVersion
    )
      return true;
    if (
      !formik?.values?.meta?.default_version_id &&
      formik?.values?.version_details?.name === LATEST_VERSION_NAME
    )
      return true;
    if (formik?.values?.version_details?.status === 'published') return true;

    return false;
  }, [
    formik?.values?.meta?.default_version_id,
    formik?.values?.version_details?.id,
    formik?.values?.version_details?.name,
    formik?.values?.version_details?.status,
    isSettingDefaultVersion,
  ]);

  const disableDelete = useMemo(() => {
    if (formik?.values?.meta?.default_version_id === formik?.values?.version_details?.id) return true;
    if (formik?.values?.version_details?.name === LATEST_VERSION_NAME) return true;

    return false;
  }, [formik?.values?.meta, formik?.values?.version_details]);

  const canDeleteVersion = isPrivate || checkPermission(PERMISSIONS.versions.delete);
  const canDeleteApplication = isPrivate || checkPermission(PERMISSIONS.applications.delete);

  const menuItems = useMemo(() => {
    const items = [
      {
        key: 'version',
        label: (
          <Box
            sx={({ palette }) => ({ color: palette.text.primary, fontSize: '.75rem', lineHeight: '1rem' })}
          >
            VERSION
          </Box>
        ),
        addSeparator: true,
        slotProps: {
          MenuItem: {
            sx: {
              pointerEvents: 'none',
            },
          },
        },
      },
      ...(viewMode === ViewMode.Public
        ? []
        : [
            {
              key: 'set-as-a-default',
              label: 'Set as a default',
              disabled: disableSetAsDefault,
              icon: <PinIcon sx={{ fontSize: '1rem' }} />,
              onClick: () => handleSetDefaultVersion(formik?.values?.version_details?.id),
            },
          ]),
      { ...exportApplicationMenuItem, disabled: !checkPermission(PERMISSIONS.applications.export) },
      shareVersionMenuItem,
      ...((formik?.values?.versions?.length ?? 0) >= 2 &&
      (isPrivate || checkPermission(PERMISSIONS.applications.update))
        ? [
            {
              key: 'compare-versions',
              label: 'Compare versions',
              icon: <DifferenceIcon sx={{ fontSize: '1rem' }} />,
              onClick: () => setCompareVersionsOpen(true),
            },
          ]
        : []),
      ...(forkEntityMenuItem ? [forkEntityMenuItem] : []),
      ...(publishApplicationMenuItem && !isFromPipeline ? [publishApplicationMenuItem] : []),
      ...(unpublishVersionMenuItem && !isFromPipeline ? [unpublishVersionMenuItem] : []),
      ...(canDeleteVersion
        ? [
            {
              key: 'delete-version',
              icon: <DeleteIcon sx={{ fontSize: '1rem' }} />,
              label: 'Delete',
              disabled: disableDelete,
              addSeparator: true,
              onClick: () => versionDeleteRef.current?.triggerDelete(),
            },
          ]
        : []),
      {
        key: isFromPipeline ? 'pipeline' : 'agent',
        label: (
          <Box
            sx={({ palette }) => ({ color: palette.text.primary, fontSize: '.75rem', lineHeight: '1rem' })}
          >
            {isFromPipeline ? 'PIPELINE' : 'AGENT'}
          </Box>
        ),
        addSeparator: true,
        slotProps: {
          MenuItem: {
            sx: {
              pointerEvents: 'none',
            },
          },
        },
      },
      {
        key: 'evaluate',
        label: 'Evaluate (Beta)',
        icon: <EvaluateIcon sx={{ fontSize: '1rem' }} />,
        addSeparator: false,
        to: {
          pathname: NavigationHelpers.buildRoute(
            isFromPipeline ? RouteDefinitions.PipelineEvaluate : RouteDefinitions.ApplicationsEvaluate,
            { tab: tab ?? 'all', agentId },
          ),
          search: location.search,
        },
      },
      shareAgentMenuItem,
      pinMenuItem,
      ...(id && viewMode !== ViewMode.Public
        ? [
            {
              key: 'run-history',
              label: 'Run History',
              icon: <RunHistoryIcon sx={{ fontSize: '1rem' }} />,
              to: runHistoryPath,
              slotProps: {
                MenuItem: { 'data-testid': `${isFromPipeline ? 'pipeline' : 'agent'}-run-history-menu-item` },
              },
            },
          ]
        : []),
      ...(canDeleteApplication
        ? [{ ...deleteApplicationMenuItem, label: `Delete ${isFromPipeline ? 'pipeline' : 'agent'}` }]
        : []),
    ];

    return items;
  }, [
    formik?.values?.version_details,
    exportApplicationMenuItem,
    checkPermission,
    forkEntityMenuItem,
    publishApplicationMenuItem,
    unpublishVersionMenuItem,
    shareVersionMenuItem,
    shareAgentMenuItem,
    pinMenuItem,
    deleteApplicationMenuItem,
    handleSetDefaultVersion,
    disableSetAsDefault,
    disableDelete,
    viewMode,
    isFromPipeline,
    canDeleteVersion,
    canDeleteApplication,
    formik?.values?.versions,
    isPrivate,
    location.search,
    tab,
    agentId,
    id,
    runHistoryPath,
  ]);

  return (
    <Box sx={styles.divider}>
      {viewMode === ViewMode.Public && (
        <Box
          sx={{
            marginRight: '0.5rem',
          }}
        >
          <AuthorsButton key="AuthorsButton" />
        </Box>
      )}
      <Controls.ControlsDropdown
        id="agent-actions"
        menuItems={menuItems}
        anchorButtonProps={isFromPipeline ? undefined : { 'data-tour': AGENT_TOUR_TARGET_IDS.actionsMenu }}
      />
      <VersionDelete
        ref={versionDeleteRef}
        type="standalone"
      />
      {publishDialog}
      {unpublishDialog}
      {setDefaultVersionDialog}
      {compareVersionsOpen && (
        <CompareVersionsModal
          open={compareVersionsOpen}
          onClose={handleCompareVersionsClose}
          entityType={compareEntityType}
          entityId={id}
          isEditorDirty={isEditorDirty}
          canListSchedules={checkPermission(PERMISSIONS.schedules.list)}
          isScheduleAdmin={checkPermission(PERMISSIONS.schedules.admin)}
          onOpenSchedule={handleOpenSchedule}
          leftVersionId={formik?.values?.version_details?.id}
          versions={formik?.values?.versions ?? []}
          onLoadVersions={loadAgentVersions}
          savingLeftKeys={savingLeftKeys}
          savingRightKeys={savingRightKeys}
          onSaveLeft={onSaveLeft}
          onSaveRight={onSaveRight}
          resetSavingState={resetSavingState}
        />
      )}
    </Box>
  );
});

ApplicationControls.displayName = 'ApplicationControls';

/** @type {MuiSx} */
const applicationControlsStyles = () => ({
  divider: {
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    paddingLeft: '0.5rem',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '0.25rem',
      bottom: '0.25rem',
      borderLeft: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
    },
  },
});

export default ApplicationControls;
