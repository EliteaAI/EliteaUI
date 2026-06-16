import { useCallback, useState } from 'react';

import { useFormikContext } from 'formik';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useSaveSkillVersion from '@/hooks/skill/useSaveSkillVersion';
import useToast from '@/hooks/useToast';
import InputVersionDialog from '@/pages/Common/Components/InputVersionDialog';

// Page-level "Save As Version" button (mirrors SaveNewVersionButton): owns the
// version-name dialog + validation and delegates the mutation to
// useSaveSkillVersion. On success it navigates to the new version via onChangeVersion.
export default function SaveSkillVersionButton({ onSuccess, onChangeVersion }) {
  const { values } = useFormikContext();
  const { toastError } = useToast();
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
      onChangeVersion?.(candidate);
    }
  }, [newVersion, values?.versions, onCreateNewVersion, onSuccess, onChangeVersion, toastError]);

  return (
    <>
      <Button.BaseBtn
        disabled={isSavingNewVersion}
        variant="elitea"
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
}
