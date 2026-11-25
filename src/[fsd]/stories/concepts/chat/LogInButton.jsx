// Chat concept: «Log in» on a row of the «who answers» list, in the place and look of «Fix»
import { memo } from 'react';

import { Button } from '@/[fsd]/shared/ui';

const LogInButton = memo(props => {
  const { onClick, isRunning, disabled } = props;
  return (
    <Button.BaseBtn
      variant="elitea"
      color="secondary"
      onClick={onClick}
      disabled={disabled || isRunning}
      data-testid="who-answers-log-in"
    >
      {isRunning ? 'Logging in...' : 'Log in'}
    </Button.BaseBtn>
  );
});

LogInButton.displayName = 'LogInButton';

export default LogInButton;
