import { memo } from 'react';

import { Button } from '@/[fsd]/shared/ui';
import TestIcon from '@/assets/test.svg?react';

/**
 * "Test" in a column header of the skill page: opens the Test panel beside it.
 */
const SkillTestButton = memo(props => {
  const { onClick, disabled = false } = props;

  return (
    <Button.IconLabelButton
      label="Test"
      icon={<TestIcon />}
      onClick={onClick}
      disabled={disabled}
      ariaLabel="Test skill"
      testId="skill-test-button"
    />
  );
});

SkillTestButton.displayName = 'SkillTestButton';

export default SkillTestButton;
