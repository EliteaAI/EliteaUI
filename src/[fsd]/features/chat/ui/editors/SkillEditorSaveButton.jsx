import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { CircularProgress } from '@mui/material';

import { hasVersionModelChanged } from '@/[fsd]/features/skill/lib/helpers';
import { useSaveSkill } from '@/[fsd]/features/skill/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';

const SkillEditorSaveButton = memo(props => {
  const { isDirty, onModelSaved } = props;
  const { values, initialValues } = useFormikContext();
  const { onSave, isSaving } = useSaveSkill();

  const handleSave = useCallback(async () => {
    const isModelChanged = hasVersionModelChanged(values, initialValues);
    if ((await onSave()) && isModelChanged) onModelSaved?.();
  }, [values, initialValues, onSave, onModelSaved]);

  return (
    <Button.BaseBtn
      variant="elitea"
      color="primary"
      onClick={handleSave}
      disabled={isSaving || !isDirty}
      startIcon={
        isSaving ? (
          <CircularProgress
            size={16}
            color="inherit"
          />
        ) : null
      }
    >
      Save
    </Button.BaseBtn>
  );
});

SkillEditorSaveButton.displayName = 'SkillEditorSaveButton';

export default SkillEditorSaveButton;
