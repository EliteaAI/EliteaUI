import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { buildVersionOption } from '@/[fsd]/entities/version';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { TIME_FORMAT } from '@/common/constants';
import { timeFormatter } from '@/common/utils';

const buildCompareVersionOption = version => {
  const base = buildVersionOption({ enableVersionListAvatar: true })(version);
  const meta = [];
  if (version.created_at) meta.push(timeFormatter(version.created_at, TIME_FORMAT.DDMMYYYY));
  if (version.author?.name) meta.push(`by ${version.author.name}`);
  return { ...base, description: meta.join(' · ') };
};

const formatVersionMeta = version => {
  if (!version) return null;
  const parts = [];
  if (version.created_at) {
    const d = new Date(version.created_at);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    parts.push(`${month} ${day}, ${year}, ${hours}:${minutes}`);
  }
  if (version.author?.name) parts.push(`by ${version.author.name}`);
  return parts.length ? parts.join(' · ') : null;
};

const CompareVersionSelector = memo(props => {
  const { leftVersion, rightVersionId, availableVersions, onRightVersionChange } = props;

  const sortedVersions = useMemo(
    () => [...availableVersions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [availableVersions],
  );

  const versionOptions = useMemo(() => sortedVersions.map(buildCompareVersionOption), [sortedVersions]);

  const leftMeta = useMemo(() => formatVersionMeta(leftVersion), [leftVersion]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.row}>
        <Typography sx={styles.label}>Base version</Typography>
        <Box sx={styles.readOnlyVersion}>
          <Typography sx={styles.versionName}>{leftVersion?.name}</Typography>
          {leftMeta && <Typography sx={styles.versionMeta}>{leftMeta}</Typography>}
        </Box>
      </Box>

      <Box sx={styles.row}>
        <Typography sx={styles.label}>Compare with</Typography>
        <SingleSelect
          value={rightVersionId ?? ''}
          options={versionOptions}
          onValueChange={onRightVersionChange}
          showOptionIcon
          showOptionDescription
          optionsWithAvatar
          iconPosition="left"
          showBorder
          placeholder="Select version to compare"
          inputSX={styles.selectInput}
        />
      </Box>
    </Box>
  );
});

CompareVersionSelector.displayName = 'CompareVersionSelector';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '1.5rem',
    minHeight: '16rem',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'text.primary',
  },
  readOnlyVersion: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.userInputBackground,
  }),
  versionName: {
    fontSize: '0.875rem',
    color: 'text.secondary',
  },
  versionMeta: {
    fontSize: '0.75rem',
    color: 'text.secondary',
    marginTop: '0.125rem',
  },
  selectInput: {
    width: '100%',
  },
};

export default CompareVersionSelector;
