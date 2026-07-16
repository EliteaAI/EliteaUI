import { useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import UnpublishConfirmModal from '@/[fsd]/entities/version/ui/UnpublishConfirmModal';
import { useUnpublishSkillMutation } from '@/[fsd]/features/skill/api';
import { CollectionStatus, PERMISSIONS } from '@/common/constants';
import UnpublishIcon from '@/components/Icons/UnpublishIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useUnpublishSkillMenu = onSuccess => {
  const { version: versionId } = useParams();

  const projectId = useSelectedProjectId();
  const { toastError, toastInfo } = useToast();

  const {
    values: {
      id: skillId,
      name: skillName,
      version_details: { id: versionIdFromDetail, name: versionName, status: versionStatus } = {},
    } = {},
  } = useFormikContext();

  const { permissions = [] } = useSelector(state => state.user);

  const [unpublish, { isLoading: isUnpublishing, reset }] = useUnpublishSkillMutation();

  const [showConfirm, setShowConfirm] = useState(false);

  const canUnpublish = useMemo(
    () => permissions.includes(PERMISSIONS.skills.publish) && versionStatus === CollectionStatus.Published,
    [permissions, versionStatus],
  );

  const currentVersionId = useMemo(() => versionId || versionIdFromDetail, [versionId, versionIdFromDetail]);

  const onUnpublish = useCallback(
    async id => {
      const { error } = await unpublish({ projectId, skillId, versionId: id, body: {} });

      if (!error) {
        toastInfo('Skill has been successfully unpublished!');
        onSuccess();
      } else {
        const errorMsg = error.data?.msg || error.data?.error || 'Failed to unpublish';
        toastError(errorMsg);
      }
      reset();
    },
    [projectId, skillId, onSuccess, unpublish, reset, toastError, toastInfo],
  );

  const handleOpenConfirm = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleConfirmUnpublish = useCallback(() => {
    setShowConfirm(false);
    onUnpublish(currentVersionId);
  }, [onUnpublish, currentVersionId]);

  const menuItem = useMemo(
    () =>
      canUnpublish
        ? {
            label: 'Unpublish',
            icon: (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '1rem',
                  height: '1rem',
                  color: ({ palette }) => palette.icon.fill.default,
                }}
              >
                <UnpublishIcon sx={{ fontSize: '1rem' }} />
              </Box>
            ),
            disabled: isUnpublishing,
            onClick: handleOpenConfirm,
          }
        : null,
    [canUnpublish, isUnpublishing, handleOpenConfirm],
  );

  const unpublishDialog = useMemo(
    () => (
      <UnpublishConfirmModal
        open={showConfirm}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmUnpublish}
        isLoading={isUnpublishing}
        entityName={skillName}
        versionName={versionName}
        entityLabel="skill"
      />
    ),
    [showConfirm, handleCancelConfirm, handleConfirmUnpublish, isUnpublishing, skillName, versionName],
  );

  return {
    unpublishSkillMenuItem: menuItem,
    unpublishDialog,
  };
};
