import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useSkillExport } from '@/[fsd]/features/skill/lib/hooks';
import { Controls, SoonLabel } from '@/[fsd]/shared/ui';
import { PinEntityType } from '@/[fsd]/widgets/pin-toggler/lib/constants';
import { usePin, usePinMenu } from '@/[fsd]/widgets/pin-toggler/lib/hooks';
import PublishIcon from '@/assets/publish-version.svg?react';
import { SkillsTabs } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils.jsx';
import { useCopyLinkMenu } from '@/components/CopyLinkToEntityButton.jsx';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import ExportIcon from '@/components/Icons/ExportIcon';
import ForkIcon from '@/components/Icons/ForkIcon';
import PinIcon from '@/components/Icons/PinIcon';
import { useProjectEntityLink } from '@/hooks/useProjectEntityLink';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import { useDeleteSkillMutation, useSetSkillDefaultVersionMutation } from '../api';

const sectionLabelSx = ({ palette }) => ({
  color: palette.text.default,
  fontSize: '.75rem',
  lineHeight: '1rem',
});

/**
 * Overflow menu for the skill editor header. Mirrors the agent's
 * ApplicationControls two-section (VERSION / SKILL) layout via
 * Controls.ControlsDropdown and reuses the entity-agnostic agent hooks.
 */
const SkillControls = memo(props => {
  const { skillId, skillName, currentVersionName, onChangeVersion } = props;

  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const { values } = useFormikContext();

  const versionDetails = values?.version_details;
  const defaultVersionId = values?.meta?.default_version_id;
  const currentVersionId = versionDetails?.id;

  const { projectEntityLink: versionLink } = useProjectEntityLink({ versionId: currentVersionId });

  const { doExport } = useSkillExport();
  const [deleteSkill] = useDeleteSkillMutation();
  const [setDefaultVersion, { isLoading: isSettingDefaultVersion }] = useSetSkillDefaultVersionMutation();

  const {
    isPinned,
    togglePin,
    isLoading: isPinLoading,
  } = usePin({
    entityId: skillId,
    entityType: PinEntityType.Skill,
  });

  const { copyLinkMenuItem: shareVersionMenuItem } = useCopyLinkMenu({
    key: 'share-version',
    label: 'Share',
    link: versionLink,
  });
  const { copyLinkMenuItem: shareSkillMenuItem } = useCopyLinkMenu({
    key: 'share-skill',
    label: 'Share',
  });
  const { pinMenuItem } = usePinMenu({
    isPinned,
    onTogglePin: togglePin,
    isLoading: isPinLoading,
  });

  const disableSetAsDefault = useMemo(() => {
    if (defaultVersionId === currentVersionId || isSettingDefaultVersion) return true;
    if (!defaultVersionId && versionDetails?.name === LATEST_VERSION_NAME) return true;
    return false;
  }, [defaultVersionId, currentVersionId, isSettingDefaultVersion, versionDetails?.name]);

  const disableDelete = useMemo(() => {
    if (defaultVersionId === currentVersionId) return true;
    if (versionDetails?.name === LATEST_VERSION_NAME) return true;
    return false;
  }, [defaultVersionId, currentVersionId, versionDetails?.name]);

  const onSetDefault = useCallback(async () => {
    try {
      const { error } = await setDefaultVersion({ projectId, skillId, versionId: currentVersionId });
      if (error) {
        toastError(buildErrorMessage(error) || 'Failed to set the default version.');
        return;
      }
      toastSuccess('The default version has been updated');
    } catch (error) {
      toastError(buildErrorMessage(error) || 'Failed to set the default version.');
    }
  }, [setDefaultVersion, projectId, skillId, currentVersionId, toastError, toastSuccess]);

  const onExport = useCallback(() => {
    doExport({ skillId, versionName: currentVersionName, skillName });
  }, [doExport, skillId, currentVersionName, skillName]);

  const onDeleteVersion = useCallback(async () => {
    try {
      const { error } = await deleteSkill({ projectId, skillId, versionName: currentVersionName });
      if (error) {
        toastError(buildErrorMessage(error) || 'Failed to delete the version.');
        return;
      }
      toastSuccess('The version has been deleted');
      onChangeVersion?.(LATEST_VERSION_NAME);
    } catch (error) {
      toastError(buildErrorMessage(error) || 'Failed to delete the version.');
    }
  }, [deleteSkill, projectId, skillId, currentVersionName, onChangeVersion, toastError, toastSuccess]);

  const onDeleteSkill = useCallback(async () => {
    try {
      const { error } = await deleteSkill({ projectId, skillId });
      if (error) {
        toastError(buildErrorMessage(error) || 'Failed to delete the skill.');
        return;
      }
      toastSuccess('The skill has been deleted');
      navigate(`${RouteDefinitions.Skills}/${SkillsTabs[0]}`);
    } catch (error) {
      toastError(buildErrorMessage(error) || 'Failed to delete the skill.');
    }
  }, [deleteSkill, projectId, skillId, navigate, toastError, toastSuccess]);

  const menuItems = useMemo(
    () => [
      {
        key: 'version',
        label: <Box sx={sectionLabelSx}>VERSION</Box>,
        addSeparator: true,
        slotProps: { MenuItem: { sx: { pointerEvents: 'none' } } },
      },
      {
        key: 'set-as-a-default',
        label: 'Set as a default',
        disabled: disableSetAsDefault,
        icon: <PinIcon sx={{ fontSize: '1rem' }} />,
        onClick: onSetDefault,
      },
      {
        key: 'export-version',
        label: 'Export',
        icon: <ExportIcon sx={{ fontSize: '1rem' }} />,
        onClick: onExport,
      },
      shareVersionMenuItem,
      {
        key: 'fork',
        label: <SoonLabel text="Fork" />,
        disabled: true,
        icon: <ForkIcon sx={{ fontSize: '1rem' }} />,
      },
      {
        key: 'publish',
        label: <SoonLabel text="Publish" />,
        disabled: true,
        icon: <PublishIcon sx={{ fontSize: '1rem' }} />,
      },
      {
        key: 'delete-version',
        label: 'Delete',
        icon: <DeleteIcon sx={{ fontSize: '1rem' }} />,
        disabled: disableDelete,
        addSeparator: true,
        entityName: skillName,
        shouldRequestInputName: true,
        confirmButtonTitle: 'Delete',
        onConfirm: onDeleteVersion,
      },
      {
        key: 'skill',
        label: <Box sx={sectionLabelSx}>SKILL</Box>,
        addSeparator: true,
        slotProps: { MenuItem: { sx: { pointerEvents: 'none' } } },
      },
      shareSkillMenuItem,
      pinMenuItem,
      {
        key: 'delete-skill',
        label: 'Delete skill',
        icon: <DeleteIcon sx={{ fontSize: '1rem' }} />,
        entityName: skillName,
        shouldRequestInputName: true,
        confirmButtonTitle: 'Delete',
        onConfirm: onDeleteSkill,
      },
    ],
    [
      disableSetAsDefault,
      onSetDefault,
      onExport,
      shareVersionMenuItem,
      disableDelete,
      skillName,
      onDeleteVersion,
      shareSkillMenuItem,
      pinMenuItem,
      onDeleteSkill,
    ],
  );

  return (
    <Box sx={skillControlsStyles.wrapper}>
      <Controls.ControlsDropdown menuItems={menuItems} />
    </Box>
  );
});

SkillControls.displayName = 'SkillControls';

/** @type {MuiSx} */
const skillControlsStyles = {
  wrapper: {
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
  },
};

export default SkillControls;
