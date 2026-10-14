import { memo, useCallback } from 'react';

import { CircularProgress } from '@mui/material';

import { useSaveSkill } from '@/[fsd]/features/skill/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';

const SkillEditorSaveButton = memo(props => {
  const { isDirty, onSaved } = props;
  const { onSave, isSaving } = useSaveSkill();

  const handleSave = useCallback(async () => {
    if (await onSave()) onSaved?.();
  }, [onSave, onSaved]);

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
