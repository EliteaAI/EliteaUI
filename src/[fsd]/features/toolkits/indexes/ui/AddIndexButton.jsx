import { memo } from 'react';

import { Button } from '@/[fsd]/shared/ui';
import PlusIcon from '@/assets/plus-icon.svg?react';

const AddIndexButton = memo(props => {
  const { onClick } = props;

  return (
    <Button.BaseBtn
      variant={Button.BUTTON_VARIANTS.iconLabel}
      startIcon={<PlusIcon />}
      onClick={onClick}
      data-testid="toolkit-indexes-add-button"
    >
      Index
    </Button.BaseBtn>
  );
});

AddIndexButton.displayName = 'AddIndexButton';

export default AddIndexButton;
