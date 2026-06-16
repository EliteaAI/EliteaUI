import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import DiscardSkillButton from '@/[fsd]/features/skill/ui/DiscardSkillButton';
import SaveSkillButton from '@/[fsd]/features/skill/ui/SaveSkillButton';
import SaveSkillVersionButton from '@/[fsd]/features/skill/ui/SaveSkillVersionButton';
import { Select } from '@/[fsd]/shared/ui';

const SkillTabBar = memo(props => {
  const { versions = [], currentVersionName, onChangeVersion, onSuccess } = props;

  const styles = skillTabBarStyles();

  const versionOptions = useMemo(
    () =>
      (versions.length ? versions : [{ name: LATEST_VERSION_NAME }]).map(v => ({
        value: v.name,
        label: v.name,
      })),
    [versions],
  );

  const selectedVersionName = useMemo(
    () => currentVersionName || versions[0]?.name || LATEST_VERSION_NAME,
    [currentVersionName, versions],
  );

  const handleVersionChange = useCallback(
    event => {
      const nextName = event?.target?.value;
      if (nextName && nextName !== selectedVersionName) {
        onChangeVersion?.(nextName);
      }
    },
    [onChangeVersion, selectedVersionName],
  );

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.centeredBlock}>
        <Select.SingleSelect
          id="skill-version-select"
          label="Version"
          options={versionOptions}
          value={selectedVersionName}
          onChange={handleVersionChange}
          showBorder
        />
      </Box>
      <Box sx={styles.rightBlock}>
        <SaveSkillButton onSuccess={onSuccess} />
        <SaveSkillVersionButton
          onSuccess={onSuccess}
          onChangeVersion={onChangeVersion}
        />
        <DiscardSkillButton />
      </Box>
    </Box>
  );
});

SkillTabBar.displayName = 'SkillTabBar';

/** @type {MuiSx} */
const skillTabBarStyles = () => ({
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: '.5rem' },
  centeredBlock: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '.5rem',
    minWidth: '12rem',
    maxWidth: '20rem',
  },
  rightBlock: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '.5rem',
  },
});

export default SkillTabBar;
