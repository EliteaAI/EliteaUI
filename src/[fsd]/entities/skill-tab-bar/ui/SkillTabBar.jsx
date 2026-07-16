import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { buildVersionOption } from '@/[fsd]/entities/version/lib/helpers';
import DiscardSkillButton from '@/[fsd]/features/skill/ui/DiscardSkillButton';
import SaveSkillButton from '@/[fsd]/features/skill/ui/SaveSkillButton';
import SaveSkillVersionButton from '@/[fsd]/features/skill/ui/SaveSkillVersionButton';
import { Select } from '@/[fsd]/shared/ui';
import PublishIcon from '@/assets/publish-version.svg?react';
import PinIcon from '@/components/Icons/PinIcon';

const SkillTabBar = memo(props => {
  const {
    versions = [],
    currentVersionId,
    defaultVersionId,
    onChangeVersion,
    onSuccess,
    handleSetDefaultVersion = null,
  } = props;

  const styles = skillTabBarStyles();

  // Id of the default version, to mark its option/value with the bolt (PinIcon).
  // Mirror the agent (ApplicationVersionSelect) + backend get_default_version():
  // when no explicit default is set, `base` is the implicit default.
  const effectiveDefaultId = useMemo(() => {
    if (defaultVersionId) return defaultVersionId;
    return versions.find(v => v.name === LATEST_VERSION_NAME)?.id;
  }, [versions, defaultVersionId]);

  const versionOptions = useMemo(() => {
    const sorted = [...versions].sort((a, b) => {
      if (a.id === effectiveDefaultId) return -1;
      if (b.id === effectiveDefaultId) return 1;
      if (a.name === LATEST_VERSION_NAME) return 1;
      if (b.name === LATEST_VERSION_NAME) return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return sorted.map(buildVersionOption({ defaultVersionID: effectiveDefaultId, handleSetDefaultVersion }));
  }, [versions, effectiveDefaultId, handleSetDefaultVersion]);

  const selectedVersionId = useMemo(
    () => currentVersionId ?? versions[0]?.id ?? '',
    [currentVersionId, versions],
  );

  const handleVersionChange = useCallback(
    event => {
      const nextId = event?.target?.value;
      if (nextId && nextId !== selectedVersionId) {
        onChangeVersion?.(nextId);
      }
    },
    [onChangeVersion, selectedVersionId],
  );

  const publishedVersionIds = useMemo(
    () => new Set(versions.filter(v => v.status === 'published').map(v => v.id)),
    [versions],
  );

  const renderVersionValue = useCallback(
    option => {
      const isPublished = publishedVersionIds.has(option?.value);

      return (
        <Box sx={styles.selectValueContainer}>
          {option?.value === effectiveDefaultId && <PinIcon sx={{ fontSize: '1rem' }} />}
          {isPublished && (
            <Box sx={styles.publishedIcon}>
              <PublishIcon sx={{ fontSize: '1rem' }} />
            </Box>
          )}
          <Typography variant="labelMedium">{option?.label}</Typography>
        </Box>
      );
    },
    [publishedVersionIds, effectiveDefaultId, styles.selectValueContainer, styles.publishedIcon],
  );

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.centeredBlock}>
        <Select.SingleSelect
          id="skill-version-select"
          separateLabel
          label="VERSION:"
          options={versionOptions}
          value={selectedVersionId}
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
  publishedIcon: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    svg: { path: { fill: `${palette.icon.fill.success} !important` } },
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
