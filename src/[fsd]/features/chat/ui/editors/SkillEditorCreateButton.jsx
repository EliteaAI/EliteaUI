import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { CircularProgress } from '@mui/material';

import { useCreateSkill } from '@/[fsd]/features/skill/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';

const SkillEditorCreateButton = memo(props => {
  const { onSkillCreated, onCreatingChange } = props;
  const { values, dirty, isValid } = useFormikContext();
  const { onCreate, isCreating } = useCreateSkill();

  const isDisabled =
    isCreating ||
    !dirty ||
    !isValid ||
    !values?.name?.trim() ||
    !values?.description?.trim() ||
    !values?.version_details?.instructions?.trim();

  const handleCreate = useCallback(async () => {
    onCreatingChange?.(true);
    try {
      const createdSkill = await onCreate();
      if (createdSkill) onSkillCreated?.(createdSkill);
    } finally {
      onCreatingChange?.(false);
    }
  }, [onCreate, onSkillCreated, onCreatingChange]);

  return (
    <Button.BaseBtn
      variant="elitea"
      color="primary"
      onClick={handleCreate}
      disabled={isDisabled}
      data-testid="chat-skill-create-button"
      startIcon={
        isCreating ? (
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

SkillEditorCreateButton.displayName = 'SkillEditorCreateButton';

export default SkillEditorCreateButton;
