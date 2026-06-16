import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { Button, Select } from '@/[fsd]/shared/ui';
import { useSkillCreateVersionMutation, useSkillUpdateMutation } from '@/api/skills';
import { buildErrorMessage } from '@/common/utils.jsx';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import InputVersionDialog from '@/pages/Common/Components/InputVersionDialog';

const SkillTabBar = memo(props => {
  const { skillId, versions = [], currentVersionName, onChangeVersion, onSuccess } = props;

  const formik = useFormikContext();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  const [updateSkill, { isLoading: isSaving }] = useSkillUpdateMutation();
  const [createVersion, { isLoading: isSavingNewVersion }] = useSkillCreateVersionMutation();

  const [showInputVersion, setShowInputVersion] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  const styles = skillTabBarStyles();

  const versionOptions = useMemo(
    () =>
      (versions.length ? versions : [{ name: LATEST_VERSION_NAME }]).map(v => ({
        value: v.name,
        label: v.name,
      })),
    [versions],
  );

  const selectedVersionName = useMemo(
    () => currentVersionName || versions[0]?.name || LATEST_VERSION_NAME,
    [currentVersionName, versions],
  );

  const handleVersionChange = useCallback(
    event => {
      const nextName = event?.target?.value;
      if (nextName && nextName !== selectedVersionName) {
        onChangeVersion?.(nextName);
      }
    },
    [onChangeVersion, selectedVersionName],
  );

  const isSaveDisabled = useMemo(
    () => isSaving || !formik?.dirty || !formik.values?.name?.trim() || !formik.values?.description?.trim(),
    [formik?.dirty, formik.values?.description, formik.values?.name, isSaving],
  );

  const onSave = useCallback(async () => {
    const name = formik.values?.name?.trim() || '';
    const description = formik.values?.description?.trim() || '';
    const instructions = formik.values?.version_details?.instructions || '';
    const tags = formik.values?.version_details?.tags || [];
    const isDefaultVersion = !selectedVersionName || selectedVersionName === LATEST_VERSION_NAME;

    try {
      if (isDefaultVersion) {
        await updateSkill({
          projectId,
          skillId,
          name,
          description,
          version: { instructions, tags },
        }).unwrap();
      } else {
        await updateSkill({ projectId, skillId, name, description }).unwrap();
        await updateSkill({
          projectId,
          skillId,
          versionName: selectedVersionName,
          instructions,
          tags,
        }).unwrap();
      }

      formik.resetForm({ values: formik.values });
      onSuccess?.();
      toastSuccess('Skill saved');
    } catch (e) {
      toastError(buildErrorMessage(e));
    }
  }, [formik, onSuccess, projectId, selectedVersionName, skillId, toastError, toastSuccess, updateSkill]);

  const onOpenVersionDialog = useCallback(() => {
    setNewVersion('');
    setShowInputVersion(true);
  }, []);

  const onCancelVersionDialog = useCallback(() => {
    setShowInputVersion(false);
    setNewVersion('');
  }, []);

  const onInputVersion = useCallback(event => {
    event.stopPropagation();
    setNewVersion(event.target?.value?.trim() || '');
  }, []);

  const onConfirmVersion = useCallback(async () => {
    const candidate = newVersion?.trim();
    if (!candidate) {
      toastError('Empty version name is not allowed!');
      return;
    }
    if (candidate.toLowerCase() === LATEST_VERSION_NAME) {
      toastError(`"${LATEST_VERSION_NAME}" is reserved. Please pick a different version name.`);
      return;
    }
    if (versions.some(v => v.name === candidate)) {
      toastError('A version with that name already exists. Please pick a unique name.');
      return;
    }

    try {
      await createVersion({
        projectId,
        skillId,
        name: candidate,
        instructions: formik.values?.version_details?.instructions || '',
        tags: formik.values?.version_details?.tags || [],
      }).unwrap();

      setShowInputVersion(false);
      setNewVersion('');
      formik.resetForm({ values: formik.values });
      onSuccess?.();
      toastSuccess(`Version "${candidate}" created`);
      onChangeVersion?.(candidate);
    } catch (e) {
      toastError(buildErrorMessage(e));
    }
  }, [
    createVersion,
    formik,
    newVersion,
    onChangeVersion,
    onSuccess,
    projectId,
    skillId,
    toastError,
    toastSuccess,
    versions,
  ]);

  return (
    <>
      <Box sx={styles.wrapper}>
        <Box sx={styles.centeredBlock}>
          <Select.SingleSelect
            id="skill-version-select"
            label="Version"
            options={versionOptions}
            value={selectedVersionName}
            onChange={handleVersionChange}
            showBorder
          />
        </Box>
        <Box sx={styles.rightBlock}>
          <Button.BaseBtn
            disabled={isSaveDisabled}
            variant="elitea"
            color="primary"
            onClick={onSave}
          >
            Save
            {isSaving && <StyledCircleProgress size={20} />}
          </Button.BaseBtn>
          <Button.BaseBtn
            disabled={isSavingNewVersion}
            variant="elitea"
            color="secondary"
            onClick={onOpenVersionDialog}
          >
            Save As Version
            {isSavingNewVersion && <StyledCircleProgress size={20} />}
          </Button.BaseBtn>
        </Box>
      </Box>
      <InputVersionDialog
        open={showInputVersion}
        showTips={false}
        disabled={!newVersion}
        title="Create version"
        doButtonTitle="Save"
        versionName={newVersion}
        disabledInput={false}
        onCancel={onCancelVersionDialog}
        onConfirm={onConfirmVersion}
        onChange={onInputVersion}
      />
    </>
  );
});

SkillTabBar.displayName = 'SkillTabBar';

/** @type {MuiSx} */
const skillTabBarStyles = () => ({
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: '.5rem' },
  centeredBlock: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '.5rem',
    minWidth: '12rem',
    maxWidth: '20rem',
  },
  rightBlock: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '.5rem',
  },
});

export default SkillTabBar;
