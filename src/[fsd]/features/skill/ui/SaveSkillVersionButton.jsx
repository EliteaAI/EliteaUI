import { memo, useCallback, useState } from 'react';

import { useFormikContext } from 'formik';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useSaveSkillVersion } from '@/[fsd]/features/skill/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useNavBlocker from '@/hooks/useNavBlocker';
import useToast from '@/hooks/useToast';
import InputVersionDialog from '@/pages/Common/Components/InputVersionDialog';

const SaveSkillVersionButton = memo(({ onSuccess, onChangeVersion }) => {
  const { values, isValid, validateForm, setTouched } = useFormikContext();
  const { toastError } = useToast();
  const { setBlockNav } = useNavBlocker();
  const { onCreateNewVersion, isSavingNewVersion } = useSaveSkillVersion();

  const [showInputVersion, setShowInputVersion] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  const onOpen = useCallback(() => {
    setNewVersion('');
    setShowInputVersion(true);
  }, []);

  const onCancel = useCallback(() => {
    setShowInputVersion(false);
    setNewVersion('');
  }, []);

  const onInput = useCallback(event => {
    event.stopPropagation();
    setNewVersion(event.target?.value?.trim() || '');
  }, []);

  const onConfirm = useCallback(async () => {
    const validationErrors = await validateForm();
    if (Object.keys(validationErrors).length) {
      setTouched({ name: true, description: true });
      return;
    }
    const candidate = newVersion?.trim();
    if (!candidate) {
      toastError('Empty version name is not allowed!');
      return;
    }
    if (candidate.toLowerCase() === LATEST_VERSION_NAME) {
      toastError(`"${LATEST_VERSION_NAME}" is reserved. Please pick a different version name.`);
      return;
    }
    if ((values?.versions || []).some(v => v.name === candidate)) {
      toastError('A version with that name already exists. Please pick a unique name.');
      return;
    }

    const ok = await onCreateNewVersion(candidate);
    if (ok) {
      setShowInputVersion(false);
      setNewVersion('');
      onSuccess?.();
      setBlockNav(false);
      setTimeout(() => onChangeVersion?.(candidate), 0);
    }
  }, [
    newVersion,
    values?.versions,
    onCreateNewVersion,
    onSuccess,
    onChangeVersion,
    setBlockNav,
    validateForm,
    setTouched,
    toastError,
  ]);

  return (
    <>
      <Button.BaseBtn
        disabled={isSavingNewVersion || !isValid}
        variant={BUTTON_VARIANTS.elitea}
        color="secondary"
        onClick={onOpen}
      >
        Save As Version
        {isSavingNewVersion && <StyledCircleProgress size={20} />}
      </Button.BaseBtn>
      <InputVersionDialog
        open={showInputVersion}
        showTips={false}
        disabled={!newVersion}
        title="Create version"
        doButtonTitle="Save"
        versionName={newVersion}
        disabledInput={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
        onChange={onInput}
      />
    </>
  );
});

SaveSkillVersionButton.displayName = 'SaveSkillVersionButton';

export default SaveSkillVersionButton;
