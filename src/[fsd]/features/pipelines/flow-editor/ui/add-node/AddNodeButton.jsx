import { memo, useCallback, useState } from 'react';

import { PIPELINE_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/assets/plus-icon.svg?react';

import NodeTypeSelector from './NodeTypeSelector';

const AddNodeButton = memo(props => {
  const { onAddNode, disabled } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = useCallback(event => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <>
      <Button.BaseBtn
        id="pipeline-add-node-menu-action"
        data-testid="pipeline-add-node-button"
        data-tour={PIPELINE_TOUR_TARGET_IDS.nodes}
        variant={BUTTON_VARIANTS.iconLabel}
        startIcon={<PlusIcon />}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleOpen}
        disabled={disabled}
      >
        Node
      </Button.BaseBtn>
      <NodeTypeSelector
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        onSelect={onAddNode}
      />
    </>
  );
});

AddNodeButton.displayName = 'AddNodeButton';

export default AddNodeButton;
