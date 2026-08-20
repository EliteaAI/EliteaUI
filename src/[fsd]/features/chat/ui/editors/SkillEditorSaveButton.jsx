import { memo, useCallback } from 'react';

import { CircularProgress } from '@mui/material';

import useSaveSkill from '@/[fsd]/features/skill/lib/hooks/useSaveSkill.hooks';
import { Button } from '@/[fsd]/shared/ui';

const SkillEditorSaveButton = memo(props => {
  const { isDirty } = props;
  const { onSave, isSaving } = useSaveSkill();

  const handleSave = useCallback(async () => {
    await onSave();
  }, [onSave]);

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
