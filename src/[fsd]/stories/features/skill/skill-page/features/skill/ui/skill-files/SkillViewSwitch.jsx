import { memo, useCallback, useMemo } from 'react';

import { SKILL_EDITOR_VIEWS } from '@/[fsd]/features/skill/lib/constants';
import { Tab } from '@/[fsd]/shared/ui';

/**
 * Settings | Files in the first column header; Files carries the count of the skill's files ("Files – 11").
 */
const SkillViewSwitch = memo(props => {
  const { value, onChange, filesCount = 0 } = props;

  const buttons = useMemo(
    () => [
      {
        value: SKILL_EDITOR_VIEWS.settings,
        label: 'Settings',
        buttonProps: { 'data-testid': 'skill-view-settings' },
      },
      {
        value: SKILL_EDITOR_VIEWS.files,
        label: `Files – ${filesCount}`,
        tooltip: 'Files',
        buttonProps: { 'data-testid': 'skill-view-files' },
      },
    ],
    [filesCount],
  );

  const handleChange = useCallback((_event, next) => onChange?.(next), [onChange]);

  return (
    <Tab.TabGroupButton
      value={value}
      onChange={handleChange}
      arrayBtn={buttons}
      disableTooltip
    />
  );
});

SkillViewSwitch.displayName = 'SkillViewSwitch';

export default SkillViewSwitch;
