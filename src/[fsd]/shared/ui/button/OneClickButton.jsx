import { memo, useState } from 'react';

import BaseBtn from './BaseBtn';

const OneClickButton = memo(props => {
  const { disabled, disableRipple, color, onClick, title = 'Button' } = props;

  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    onClick && onClick();
    setIsClicked(true);
  };

  return (
    <BaseBtn
      variant="elitea"
      color={color}
      disabled={isClicked || disabled}
      onClick={handleClick}
      disableRipple={disableRipple}
    >
      {title}
    </BaseBtn>
  );
});

OneClickButton.displayName = 'OneClickButton';

export default OneClickButton;
