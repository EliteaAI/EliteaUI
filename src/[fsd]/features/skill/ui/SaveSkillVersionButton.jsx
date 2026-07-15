import { memo, useCallback, useState } from 'react';

import { useFormikContext } from 'formik';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useSaveSkillVersion } from '@/[fsd]/features/skill/lib/hooks';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useNavBlocker from '@/hooks/useNavBlocker';
import useToast from '@/hooks/useToast';

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
      setTouched({ name: true, description: true, version_details: { instructions: true } });
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

    const created = await onCreateNewVersion(candidate);
    if (created) {
      setShowInputVersion(false);
      setNewVersion('');
      onSuccess?.();
      setBlockNav(false);
      setTimeout(() => onChangeVersion?.(created.id), 0);
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

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && newVersion) {
        event.preventDefault();
        onConfirm();
      }
    },
    [newVersion, onConfirm],
  );

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
      <Modal.BaseModal
        open={showInputVersion}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.success}
        title="Create version"
        onClose={onCancel}
        onConfirm={onConfirm}
        confirmButtonText="Save"
        confirming={!newVersion}
        onKeyDown={handleKeyDown}
        content={
          <Input.InputBase
            label="Name"
            value={newVersion}
            onChange={onInput}
            inputProps={{ maxLength: 255 }}
            autoFocus
          />
        }
      />
    </>
  );
});

SaveSkillVersionButton.displayName = 'SaveSkillVersionButton';

export default SaveSkillVersionButton;
