import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Button } from '@/[fsd]/shared/ui';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useSaveSkill from '@/hooks/skill/useSaveSkill';

// Page-level Save button for a skill (mirrors SaveApplicationButton): owns the
// disabled logic and delegates the mutation to useSaveSkill.
export default function SaveSkillButton({ onSuccess }) {
  const { values, dirty } = useFormikContext();
  const { onSave, isSaving } = useSaveSkill();

  const isDisabled = useMemo(
    () => isSaving || !dirty || !values?.name?.trim() || !values?.description?.trim(),
    [isSaving, dirty, values?.name, values?.description],
  );

  const handleSave = useCallback(async () => {
    const ok = await onSave();
    if (ok) onSuccess?.();
  }, [onSave, onSuccess]);

  return (
    <Button.BaseBtn
      disabled={isDisabled}
      variant="elitea"
      color="primary"
      onClick={handleSave}
    >
      Save
      {isSaving && <StyledCircleProgress size={20} />}
    </Button.BaseBtn>
  );
}
