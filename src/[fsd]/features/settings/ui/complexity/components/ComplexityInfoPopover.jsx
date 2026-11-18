import { memo } from 'react';

import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { InfoPopover } from '@/[fsd]/shared/ui/info-popover';

import ComplexityInfo from './ComplexityInfo';

const ComplexityInfoPopover = memo(props => {
  const { meta } = props;

  return (
    <InfoPopover
      label="About Complexity"
      storageKey={ComplexityConstants.LS_COMPLEXITY_INFO_DISMISSED}
      testIdPrefix="complexity-info"
    >
      <ComplexityInfo meta={meta} />
    </InfoPopover>
  );
});

ComplexityInfoPopover.displayName = 'ComplexityInfoPopover';

export default ComplexityInfoPopover;
