import { memo, useCallback, useMemo } from 'react';

import { Tab } from '@/[fsd]/shared/ui';
import { SECTION_MODES } from '@/[fsd]/widgets/section-page/lib/constants';

const SectionModeTabs = memo(props => {
  const { value, onChange, isTeam = false, testIdPrefix, tourIds } = props;

  const modes = useMemo(
    () => [
      {
        value: SECTION_MODES.project,
        label: isTeam ? 'Team' : 'Yours',
        buttonProps: { 'data-testid': `${testIdPrefix}-mode-project`, 'data-tour': tourIds?.project },
      },
      {
        value: SECTION_MODES.discover,
        label: 'Discover',
        buttonProps: { 'data-testid': `${testIdPrefix}-mode-discover`, 'data-tour': tourIds?.discover },
      },
    ],
    [isTeam, testIdPrefix, tourIds?.discover, tourIds?.project],
  );

  const handleChange = useCallback((_, nextValue) => onChange(nextValue), [onChange]);

  return (
    <Tab.TabGroupButton
      value={value}
      onChange={handleChange}
      arrayBtn={modes}
      disableTooltip
    />
  );
});

SectionModeTabs.displayName = 'SectionModeTabs';

export default SectionModeTabs;
