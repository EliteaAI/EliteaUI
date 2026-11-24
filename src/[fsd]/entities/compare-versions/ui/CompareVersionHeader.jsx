import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { formatVersionMeta } from '../lib/helpers/compareVersions.helpers';
import CompareSaveButton from './CompareSaveButton';

const CompareVersionHeader = memo(props => {
  const { version, save, saveTestId } = props;
  const meta = useMemo(() => formatVersionMeta(version), [version]);

  return (
    <Box sx={compareVersionHeaderStyles.root}>
      <Box sx={compareVersionHeaderStyles.text}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
          sx={compareVersionHeaderStyles.name}
        >
          {version?.name}
        </Typography>
        {meta && (
          <Typography
            variant="bodySmall"
            color="text.primary"
            sx={compareVersionHeaderStyles.meta}
          >
            {meta}
          </Typography>
        )}
      </Box>
      {save && (
        <CompareSaveButton
          label="Save"
          isDirty={save.isDirty}
          isSaving={save.isSaving}
          disabledReason={save.disabledReason}
          onClick={save.onSave}
          testId={saveTestId}
          sx={compareVersionHeaderStyles.save}
        />
      )}
    </Box>
  );
});

CompareVersionHeader.displayName = 'CompareVersionHeader';

/** @type {MuiSx} */
const compareVersionHeaderStyles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    paddingInline: '0.5rem',
    textAlign: 'left',
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
  },
  name: {
    textTransform: 'uppercase',
  },
  meta: {
    textTransform: 'none',
    letterSpacing: 'normal',
  },
  save: {
    alignSelf: 'center',
    flexShrink: 0,
  },
};

export default CompareVersionHeader;
