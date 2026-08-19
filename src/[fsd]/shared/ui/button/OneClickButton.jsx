import { memo, useState } from 'react';

import BaseBtn from './BaseBtn';

const OneClickButton = memo(props => {
  const { disabled, disableRipple, color, onClick, title = 'Button', 'data-testid': dataTestId } = props;

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
      data-testid={dataTestId}
    >
      {title}
    </BaseBtn>
  );
});

OneClickButton.displayName = 'OneClickButton';

export default OneClickButton;
