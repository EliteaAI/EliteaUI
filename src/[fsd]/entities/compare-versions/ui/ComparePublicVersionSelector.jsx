import { memo, useMemo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';

import { COMPARE_MESSAGES } from '../lib/constants/compareVersions.constants';
import { buildCompareVersionOption } from '../lib/helpers/compareVersions.helpers';

const sortNewestFirst = versions =>
  [...versions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

// Picks a version of this agent and a published version of the public agent it was forked from
const ComparePublicVersionSelector = memo(props => {
  const {
    versions = [],
    leftVersionId,
    onLeftVersionChange,
    publicVersions = [],
    rightVersionId,
    onRightVersionChange,
    isLoading = false,
    loadError = '',
  } = props;
  const styles = comparePublicVersionSelectorStyles;

  const leftOptions = useMemo(() => sortNewestFirst(versions).map(buildCompareVersionOption), [versions]);
  const rightOptions = useMemo(
    () => sortNewestFirst(publicVersions).map(buildCompareVersionOption),
    [publicVersions],
  );

  const renderPublicSelect = () => {
    if (isLoading) {
      return (
        <Box
          sx={styles.status}
          data-testid="compare-public-loading"
        >
          <CircularProgress size={16} />
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            {COMPARE_MESSAGES.publicLoading}
          </Typography>
        </Box>
      );
    }
    if (loadError) {
      return (
        <Typography
          variant="bodyMedium"
          color="text.warning"
          data-testid="compare-public-error"
        >
          {loadError}
        </Typography>
      );
    }
    if (publicVersions.length === 0) {
      return (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          data-testid="compare-public-empty"
        >
          {COMPARE_MESSAGES.publicNoVersions}
        </Typography>
      );
    }
    return (
      <SingleSelect
        value={rightVersionId ?? ''}
        options={rightOptions}
        onValueChange={onRightVersionChange}
        showOptionIcon
        showOptionDescription
        optionsWithAvatar
        iconPosition="left"
        showBorder
        placeholder="Select the public version"
        inputSX={styles.selectInput}
        data-testid="compare-public-version-select"
      />
    );
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.row}>
        <Typography
          variant="labelMedium"
          color="text.primary"
        >
          {COMPARE_MESSAGES.publicYourVersion}
        </Typography>
        <SingleSelect
          value={leftVersionId ?? ''}
          options={leftOptions}
          onValueChange={onLeftVersionChange}
          showOptionIcon
          showOptionDescription
          optionsWithAvatar
          iconPosition="left"
          showBorder
          placeholder="Select your version"
          inputSX={styles.selectInput}
          data-testid="compare-local-version-select"
        />
      </Box>

      <Box sx={styles.row}>
        <Typography
          variant="labelMedium"
          color="text.primary"
        >
          {COMPARE_MESSAGES.publicVersion}
        </Typography>
        {renderPublicSelect()}
      </Box>
    </Box>
  );
});

ComparePublicVersionSelector.displayName = 'ComparePublicVersionSelector';

/** @type {MuiSx} */
const comparePublicVersionSelectorStyles = {
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
  selectInput: {
    width: '100%',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
};

export default ComparePublicVersionSelector;
