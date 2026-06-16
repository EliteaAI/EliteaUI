import { memo } from 'react';

import { useFormikContext } from 'formik';

import { Button } from '@/[fsd]/shared/ui';

const DiscardSkillButton = memo(() => {
  const { dirty, resetForm } = useFormikContext();

  return (
    <Button.DiscardButton
      disabled={!dirty}
      onDiscard={resetForm}
    />
  );
});

DiscardSkillButton.displayName = 'DiscardSkillButton';

export default DiscardSkillButton;
