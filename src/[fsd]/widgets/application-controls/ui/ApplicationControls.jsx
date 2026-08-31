import { memo, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { CompareVersionsModal } from '@/[fsd]/entities/compare-versions';
import {
  LATEST_VERSION_NAME,
  VersionDelete,
  usePublishApplicationMenu,
  useSetDefaultVersion,
  useUnpublishVersionMenu,
} from '@/[fsd]/entities/version';
import { useCompareAgentVersions } from '@/[fsd]/features/agent/lib/hooks';
import { PinEntityConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useProjectType } from '@/[fsd]/shared/lib/hooks/useProjectType.hooks';
import { Controls } from '@/[fsd]/shared/ui';
import { EvaluateIcon } from '@/[fsd]/shared/ui/icon';
import { usePin, usePinMenu } from '@/[fsd]/widgets/pin-toggler/lib/hooks';
import { PERMISSIONS, ViewMode } from '@/common/constants';
import { useCopyLinkMenu } from '@/components/CopyLinkToEntityButton.jsx';
import { useForkEntityMenu } from '@/components/Fork/ForkEntityButton';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DifferenceIcon from '@/components/Icons/DifferenceIcon';
import PinIcon from '@/components/Icons/PinIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import { useProjectEntityLink } from '@/hooks/useProjectEntityLink';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useViewMode from '@/hooks/useViewMode';
import { useDeleteApplicationMenu } from '@/pages/Applications/Components/Applications/DeleteApplicationButton';
import { useExportApplicationMenu } from '@/pages/Applications/Components/Applications/ExportApplicationButton';
import { AuthorsButton } from '@/pages/Common';
import RouteDefinitions from '@/routes';

const ApplicationControls = memo(props => {
  const { setBlockNav, onSuccess } = props;
  const { checkPermission } = useCheckPermission();
  const { isPrivate } = useProjectType();
  const isFromPipeline = useIsFromPipelineDetail();
  const formik = useFormikContext();
  const viewMode = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { tab, agentId } = useParams();
  const versionDeleteRef = useRef(null);
  const projectId = useSelectedProjectId();
  const [compareVersionsOpen, setCompareVersionsOpen] = useState(false);

  const { values: { id } = {} } = formik;

  const {
    loadVersions: loadAgentVersions,
    savingLeftKeys,
    savingRightKeys,
    onSaveLeft,
    onSaveRight,
    resetSavingState,
  } = useCompareAgentVersions({ projectId, applicationId: id });

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
            sx={({ palette }) => ({ color: palette.text.default, fontSize: '.75rem', lineHeight: '1rem' })}
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
      ...(!isFromPipeline &&
      (formik?.values?.versions?.length ?? 0) >= 2 &&
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
      ...(!isFromPipeline
        ? [
            {
              key: 'evaluate',
              label: 'Evaluate (beta)',
              icon: <EvaluateIcon sx={{ fontSize: '1rem' }} />,
              addSeparator: false,
              onClick: () => {
                const path = NavigationHelpers.buildRoute(RouteDefinitions.ApplicationsEvaluate, {
                  tab: tab ?? 'all',
                  agentId,
                });
                navigate({ pathname: path, search: location.search });
              },
            },
          ]
        : []),
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
            sx={({ palette }) => ({ color: palette.text.default, fontSize: '.75rem', lineHeight: '1rem' })}
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
      shareAgentMenuItem,
      pinMenuItem,
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
    navigate,
    location.search,
    tab,
    agentId,
  ]);

  return (
    <Box
      sx={{
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
          borderLeft: ({ palette }) => `1px solid ${palette.border.lines}`,
        },
      }}
    >
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
          onClose={() => setCompareVersionsOpen(false)}
          entityType={isFromPipeline ? 'pipeline' : 'agent'}
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

export default ApplicationControls;
