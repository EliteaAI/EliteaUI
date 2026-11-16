import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';

import { buildCompareVersionOption, formatVersionMeta } from '../lib/helpers/compareVersions.helpers';

const CompareVersionSelector = memo(props => {
  const { leftVersion, rightVersionId, availableVersions, onRightVersionChange } = props;

  const sortedVersions = useMemo(
    () => [...availableVersions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [availableVersions],
  );

  const versionOptions = useMemo(() => sortedVersions.map(buildCompareVersionOption), [sortedVersions]);

  const leftMeta = useMemo(() => formatVersionMeta(leftVersion), [leftVersion]);

  return (
    <Box sx={compareVersionSelectorStyles.container}>
      <Box sx={compareVersionSelectorStyles.row}>
        <Typography
          variant="labelMedium"
          color="text.primary"
        >
          Base version
        </Typography>
        <Box sx={compareVersionSelectorStyles.readOnlyVersion}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            {leftVersion?.name}
          </Typography>
          {leftMeta && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
              sx={compareVersionSelectorStyles.versionMeta}
            >
              {leftMeta}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={compareVersionSelectorStyles.row}>
        <Typography
          variant="labelMedium"
          color="text.primary"
        >
          Compare with
        </Typography>
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
          inputSX={compareVersionSelectorStyles.selectInput}
        />
      </Box>
    </Box>
  );
});

CompareVersionSelector.displayName = 'CompareVersionSelector';

/** @type {MuiSx} */
const compareVersionSelectorStyles = {
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
  readOnlyVersion: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.surface.interactive.default,
  }),
  versionMeta: {
    marginTop: '0.125rem',
  },
  selectInput: {
    width: '100%',
  },
};

export default CompareVersionSelector;
