import { memo } from 'react';

import Tooltip from '@/ComponentsLib/Tooltip';
import { PersonalSpaceConstants } from '@/[fsd]/widgets/Sidebar/lib/constants';
import { useDisablePersonalSpace } from '@/[fsd]/widgets/Sidebar/lib/hooks';

const TooltipForDisablePersonalSpace = memo(({ children, ...props }) => {
  const { shouldDisablePersonalSpace } = useDisablePersonalSpace();
  return (
    <Tooltip
      {...props}
      title={shouldDisablePersonalSpace ? PersonalSpaceConstants.TipContent : ''}
    >
      {children}
    </Tooltip>
  );
});

TooltipForDisablePersonalSpace.displayName = 'TooltipForDisablePersonalSpace';

export default TooltipForDisablePersonalSpace;
