import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import DiscardSkillButton from '@/[fsd]/features/skill/ui/DiscardSkillButton';
import SaveSkillButton from '@/[fsd]/features/skill/ui/SaveSkillButton';
import SaveSkillVersionButton from '@/[fsd]/features/skill/ui/SaveSkillVersionButton';
import { Select } from '@/[fsd]/shared/ui';
import { TIME_FORMAT } from '@/common/constants';
import { timeFormatter } from '@/common/utils';
import PinIcon from '@/components/Icons/PinIcon';

const SkillTabBar = memo(props => {
  const { versions = [], currentVersionName, defaultVersionId, onChangeVersion, onSuccess } = props;

  const styles = skillTabBarStyles();

  // Name of the default version, to mark its option/value with the bolt (PinIcon).
  // Mirror the agent (ApplicationVersionSelect) + backend get_default_version():
  // when no explicit default is set, `base` is the implicit default.
  const defaultVersionName = useMemo(() => {
    if (defaultVersionId) return versions.find(v => v.id === defaultVersionId)?.name;
    return LATEST_VERSION_NAME;
  }, [versions, defaultVersionId]);

  const versionOptions = useMemo(() => {
    const list = versions.length ? versions : [{ name: LATEST_VERSION_NAME }];
    const sorted = [...list].sort((a, b) => {
      if (a.name === defaultVersionName) return -1;
      if (b.name === defaultVersionName) return 1;
      if (a.name === LATEST_VERSION_NAME) return 1;
      if (b.name === LATEST_VERSION_NAME) return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return sorted.map(v => ({
      value: v.name,
      label: v.name,
      // Show "name - date" in the dropdown like agents (same TIME_FORMAT).
      ...(v.created_at ? { date: timeFormatter(v.created_at, TIME_FORMAT.DDMMYYYY) } : {}),
      ...(v.name === defaultVersionName ? { icon: <PinIcon sx={{ fontSize: '1rem' }} /> } : {}),
    }));
  }, [versions, defaultVersionName]);

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

  const renderVersionValue = useCallback(
    option => (
      <Box sx={styles.selectValueContainer}>
        {option?.value === defaultVersionName && <PinIcon sx={{ fontSize: '1rem' }} />}
        <Typography variant="labelMedium">{option?.label}</Typography>
      </Box>
    ),
    [defaultVersionName, styles.selectValueContainer],
  );

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.centeredBlock}>
        <Select.SingleSelect
          id="skill-version-select"
          separateLabel
          label="VERSION:"
          options={versionOptions}
          value={selectedVersionName}
          onChange={handleVersionChange}
          customRenderValue={renderVersionValue}
          showOptionIcon
          iconPosition="right"
          inputSX={styles.inputSx}
          labelSX={styles.label}
          maxDisplayValueLength="12.5rem"
          menuItemIconSX={styles.menuItemIconSx}
          customMenuProps={{ sx: styles.customMenuPropsSx }}
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
  },
  rightBlock: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '.5rem',
  },
  selectValueContainer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    justifyContent: 'flex-start',
    svg: {
      fontSize: '1rem',
      path: { fill: palette.icon.fill.inactive },
    },
  }),
  label: ({ palette }) => ({
    display: 'flex',
    fontWeight: 500,
    fontSize: '.75rem',
    lineHeight: '1rem',
    color: palette.text.default,
  }),
  inputSx: {
    '& .MuiSelect-select': {
      paddingRight: '.5rem !important',
    },
  },
  menuItemIconSx: {
    width: '1rem',
    height: '1rem',
    svg: { fontSize: '1rem', path: { fill: ({ palette }) => palette.icon.fill.inactive } },
  },
  customMenuPropsSx: {
    '& .MuiPaper-root': {
      width: '15rem',
      maxWidth: '15rem',
      minWidth: '15rem',
    },
  },
});

export default SkillTabBar;
