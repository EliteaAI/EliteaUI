import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useParams } from 'react-router-dom';

import { Box, Button, Typography } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { AgentDetails } from '@/[fsd]/features/agent/ui';
import AlertDialog from '@/components/AlertDialog';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import useDeleteVersion from '@/hooks/application/useDeleteVersion';
import useToast from '@/hooks/useToast';
import useDiscardApplicationChanges from '@/pages/Applications/useDiscardApplicationChanges';

const VersionDelete = memo(props => {
  const { disabled, onDiscard, type = 'button' } = props;
  const { version: versionId } = useParams();

  const { toastError, toastInfo, toastSuccess } = useToast();

  const {
    values: {
      id: applicationId,
      version_details: { id: versionIdFromDetail } = {},
      versions = [],
      meta: { default_version_id: defaultVersionID } = {},
    } = {},
  } = useFormikContext();

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openReplacementModal, setOpenReplacementModal] = useState(false);

  const currentVersionId = useMemo(() => versionId || versionIdFromDetail, [versionId, versionIdFromDetail]);
  const currentVersionName = useMemo(
    () => versions?.find(version => version.id == currentVersionId)?.name,
    [currentVersionId, versions],
  );
  const latestVersionId = useMemo(
    () => versions?.find(version => version.name === LATEST_VERSION_NAME)?.id,
    [versions],
  );

  const { discardApplicationChanges } = useDiscardApplicationChanges(onDiscard);

  const {
    doCheckVersionInUse,
    isCheckingInUse,
    versionInUseData,
    resetVersionInUseData,
    doDeleteVersion,
    isDeletingVersion,
  } = useDeleteVersion({
    versionId: currentVersionId,
    applicationId,
    toastError,
    toastInfo,
    toastSuccess,
    versions,
    defaultVersionID,
  });

  const isLoading = useMemo(() => isCheckingInUse || isDeletingVersion, [isCheckingInUse, isDeletingVersion]);

  const onDeleteVersionClick = useCallback(async () => {
    if (isLoading) return;

    const checkResult = await doCheckVersionInUse();

    if (!checkResult) return;

    if (checkResult.in_use) setOpenReplacementModal(true);
    else setOpenConfirmDialog(true);
  }, [doCheckVersionInUse, isLoading]);

  const onCloseConfirmDialog = useCallback(() => {
    setOpenConfirmDialog(false);
    resetVersionInUseData();
  }, [resetVersionInUseData]);

  const onCloseReplacementModal = useCallback(() => {
    setOpenReplacementModal(false);
    resetVersionInUseData();
  }, [resetVersionInUseData]);

  const onConfirmSimpleDelete = useCallback(async () => {
    setOpenConfirmDialog(false);
    discardApplicationChanges();

    await doDeleteVersion(null);
  }, [discardApplicationChanges, doDeleteVersion]);

  const onConfirmReplaceAndDelete = useCallback(
    async newVersionId => {
      discardApplicationChanges();

      const success = await doDeleteVersion(newVersionId);

      if (success) {
        setOpenReplacementModal(false);
        resetVersionInUseData();
      }
    },
    [discardApplicationChanges, doDeleteVersion, resetVersionInUseData],
  );

  if (currentVersionId === latestVersionId && type === 'button') return null;

  return (
    <>
      {type === 'menuItem' ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '1rem',
          }}
          onClick={e => {
            e.stopPropagation();
            onDeleteVersionClick();
          }}
        >
          <DeleteIcon sx={{ fontSize: '1rem' }} />
          <Typography sx={{ fontWeight: 500, fontSize: '.875rem', lineHeight: '1.5rem' }}>Delete</Typography>
        </Box>
      ) : (
        <Button
          disabled={isLoading || disabled}
          variant="alita"
          color="secondary"
          onClick={onDeleteVersionClick}
        >
          Delete Version
          {isLoading && <StyledCircleProgress size={20} />}
        </Button>
      )}

      <AlertDialog
        title="Delete version"
        alertContent={`Are you sure to delete ${currentVersionName}?`}
        open={openConfirmDialog}
        alarm
        onClose={onCloseConfirmDialog}
        onCancel={onCloseConfirmDialog}
        onConfirm={onConfirmSimpleDelete}
      />

      <AgentDetails.VersionReplacementModal
        open={openReplacementModal}
        onClose={onCloseReplacementModal}
        versionName={versionInUseData?.version_name || currentVersionName}
        referencingParents={versionInUseData?.referencing_parents || []}
        replacementVersions={versionInUseData?.replacement_versions || []}
        onReplace={onConfirmReplaceAndDelete}
        isReplacing={isDeletingVersion}
        defaultVersionId={defaultVersionID}
      />
    </>
  );
});

VersionDelete.displayName = 'VersionDelete';

export default VersionDelete;
