import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { useSaveSkill } from '@/[fsd]/features/skill/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';

const SaveSkillButton = memo(({ onSuccess }) => {
  const { values, dirty, isValid, validateForm, setTouched } = useFormikContext();
  const { onSave, isSaving } = useSaveSkill();

  const isDisabled = useMemo(
    () => isSaving || !dirty || !isValid || !values?.name?.trim() || !values?.description?.trim(),
    [isSaving, dirty, isValid, values?.name, values?.description],
  );

  const handleSave = useCallback(async () => {
    const validationErrors = await validateForm();
    if (Object.keys(validationErrors).length) {
      setTouched({ name: true, description: true });
      return;
    }
    const ok = await onSave();
    if (ok) onSuccess?.();
  }, [onSave, onSuccess, validateForm, setTouched]);

  return (
    <Button.BaseBtn
      disabled={isDisabled}
      variant={BUTTON_VARIANTS.elitea}
      color="primary"
      onClick={handleSave}
    >
      Save
      {isSaving && <StyledCircleProgress size={20} />}
    </Button.BaseBtn>
  );
});

SaveSkillButton.displayName = 'SaveSkillButton';

export default SaveSkillButton;
