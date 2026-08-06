import { memo } from 'react';

import Tooltip from '@/ComponentsLib/Tooltip';
import { PersonalSpaceConstants } from '@/[fsd]/widgets/sidebar-root/lib/constants';
import { useDisablePersonalSpace } from '@/[fsd]/widgets/sidebar-root/lib/hooks';

const TooltipForDisablePersonalSpace = memo(props => {
  const { children, ...restProps } = props;
  const { shouldDisablePersonalSpace } = useDisablePersonalSpace();
  return (
    <Tooltip
      {...restProps}
      title={shouldDisablePersonalSpace ? PersonalSpaceConstants.TipContent : ''}
    >
      {children}
    </Tooltip>
  );
});

TooltipForDisablePersonalSpace.displayName = 'TooltipForDisablePersonalSpace';

export default TooltipForDisablePersonalSpace;
