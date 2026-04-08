import { memo, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useSetDefaultVersion, useUnpublishVersionMenu } from '@/[fsd]/entities/version/lib/hooks';
import { usePublishApplicationMenu } from '@/[fsd]/entities/version/lib/hooks/usePublishVersionMenu.hooks';
import VersionDelete from '@/[fsd]/entities/version/ui/VersionDelete';
import { Controls } from '@/[fsd]/shared/ui';
import { PinEntityType } from '@/[fsd]/widgets/PinToggler/lib/constants';
import { usePin, usePinMenu } from '@/[fsd]/widgets/PinToggler/lib/hooks';
import { PERMISSIONS, ViewMode } from '@/common/constants';
import { useCopyLinkMenu } from '@/components/CopyLinkToEntityButton.jsx';
import { useForkEntityMenu } from '@/components/Fork/ForkEntityButton';
import PinIcon from '@/components/Icons/PinIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import { useProjectEntityLink } from '@/hooks/useProjectEntityLink';
import useViewMode from '@/hooks/useViewMode';
import { useDeleteApplicationMenu } from '@/pages/Applications/Components/Applications/DeleteApplicationButton';
import { useExportApplicationMenu } from '@/pages/Applications/Components/Applications/ExportApplicationButton';
import { AuthorsButton } from '@/pages/Common';

const ApplicationControls = memo(({ setBlockNav, onSuccess }) => {
  const { checkPermission } = useCheckPermission();
  const isFromPipeline = useIsFromPipelineDetail();
  const formik = useFormikContext();
  const viewMode = useViewMode();

  const { values: { id } = {} } = formik;

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
    entityType: PinEntityType.Application,
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
      ...(forkEntityMenuItem ? [forkEntityMenuItem] : []),
      ...(publishApplicationMenuItem && !isFromPipeline ? [publishApplicationMenuItem] : []),
      ...(unpublishVersionMenuItem && !isFromPipeline ? [unpublishVersionMenuItem] : []),
      {
        key: 'delete-version',
        label: <VersionDelete type="menuItem" />,
        disabled: disableDelete,
        addSeparator: true,
      },
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
      { ...deleteApplicationMenuItem, label: `Delete ${isFromPipeline ? 'pipeline' : 'agent'}` },
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
      <Controls.ControlsDropdown menuItems={menuItems} />
      {publishDialog}
      {unpublishDialog}
      {setDefaultVersionDialog}
    </Box>
  );
});

ApplicationControls.displayName = 'ApplicationControls';

export default ApplicationControls;
