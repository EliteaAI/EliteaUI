import { memo, useState } from 'react';

import { Button } from '@mui/material';

const OneClickButton = memo(props => {
  const { disabled, disableRipple, color, onClick, title = 'Button' } = props;

  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    onClick && onClick();
    setIsClicked(true);
  };

  return (
    <Button
      variant="elitea"
      color={color}
      disabled={isClicked || disabled}
      onClick={handleClick}
      disableRipple={disableRipple}
    >
      {title}
    </Button>
  );
});

OneClickButton.displayName = 'OneClickButton';

export default OneClickButton;
