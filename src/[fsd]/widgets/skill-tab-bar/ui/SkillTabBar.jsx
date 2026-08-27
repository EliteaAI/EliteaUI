import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { LATEST_VERSION_NAME, buildVersionOption } from '@/[fsd]/entities/version';
import { VersionSelectOption } from '@/[fsd]/entities/version/ui';
import { DiscardSkillButton, SaveSkillButton, SaveSkillVersionButton } from '@/[fsd]/features/skill';
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

  const [searchQuery, setSearchQuery] = useState('');

  const styles = skillTabBarStyles();

  // When no explicit default is set, `base` is the implicit default.
  const effectiveDefaultId = useMemo(() => {
    if (defaultVersionId) return defaultVersionId;
    return versions.find(v => v.name === LATEST_VERSION_NAME)?.id;
  }, [versions, defaultVersionId]);

  // Sort: newest first by created_at; base always last.
  // Default version stays in its chronological position — not pinned to top.
  const versionOptions = useMemo(() => {
    const sorted = [...versions].sort((a, b) => {
      if (a.name === LATEST_VERSION_NAME) return 1;
      if (b.name === LATEST_VERSION_NAME) return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return sorted.map(buildVersionOption({ defaultVersionID: effectiveDefaultId, handleSetDefaultVersion }));
  }, [versions, effectiveDefaultId, handleSetDefaultVersion]);

  // Multi-field search: filter by pre-computed searchText (version name + creator, lowercase).
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return versionOptions;
    const q = searchQuery.toLowerCase();

    return versionOptions.filter(opt => opt.searchText?.includes(q));
  }, [versionOptions, searchQuery]);

  const handleSearch = useCallback(q => setSearchQuery(q), []);

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
          {option?.value === effectiveDefaultId && <PinIcon sx={styles.iconSm} />}
          {isPublished && (
            <Box sx={styles.publishedIcon}>
              <PublishIcon sx={styles.iconSm} />
            </Box>
          )}
          <Typography variant="labelMedium">{option?.label}</Typography>
        </Box>
      );
    },
    [
      publishedVersionIds,
      styles.selectValueContainer,
      styles.iconSm,
      styles.publishedIcon,
      effectiveDefaultId,
    ],
  );

  const customRenderOption = useCallback(
    option => (
      <VersionSelectOption
        name={option.label}
        meta={option.versionMeta}
        avatar={option.versionAvatar}
        icon={option.icon}
      />
    ),
    [],
  );

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.centeredBlock}>
        <Select.SingleSelect
          id="skill-version-select"
          data-testid="skill-version-select"
          separateLabel
          label="VERSION:"
          options={filteredOptions}
          value={selectedVersionId}
          onChange={handleVersionChange}
          customRenderValue={renderVersionValue}
          customRenderOption={customRenderOption}
          showOptionIcon
          iconPosition="right"
          inputSX={styles.inputSx}
          labelSX={styles.label}
          maxDisplayValueLength="12.5rem"
          menuItemIconSX={styles.menuItemIconSx}
          customMenuProps={{ sx: styles.customMenuPropsSx }}
          emptyPlaceholder="No versions found."
          withSearch
          searchPlaceholder="Search by version or author"
          searchFilterMode="remote"
          searchString={searchQuery}
          onSearch={handleSearch}
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
      width: '20rem',
      maxWidth: '20rem',
      minWidth: '20rem',
    },
  },
  iconSm: {
    fontSize: '1rem',
  },
});

export default SkillTabBar;
