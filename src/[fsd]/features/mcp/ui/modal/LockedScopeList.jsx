import { memo, useMemo } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

// The scopes a sign-in asks for when the user cannot change them (admin app, fixed credential scopes):
// every scope stays visible and wraps, instead of a disabled one-line input cut off with "..." (#7449)
const LockedScopeList = memo(props => {
  const { scope = '', tooltip } = props;

  const scopes = useMemo(() => scope.split(/\s+/).filter(Boolean), [scope]);
  const styles = lockedScopeListStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="oauth-scope-list"
    >
      <Typography
        variant="bodySmall"
        color="text.secondary"
        sx={styles.label}
      >
        Scope
        {tooltip && (
          <InfoTooltip
            infoTooltip={tooltip}
            sx={styles.infoIconWrapper}
          />
        )}
      </Typography>
      <Box sx={styles.chips}>
        {scopes.length ? (
          scopes.map(item => (
            <Chip
              key={item}
              label={item}
              size="small"
              variant="outlined"
              sx={styles.chip}
            />
          ))
        ) : (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            None
          </Typography>
        )}
      </Box>
    </Box>
  );
});

LockedScopeList.displayName = 'LockedScopeList';

/** @type {MuiSx} */
const lockedScopeListStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
  },
  infoIconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '0.25rem',
    color: 'text.secondary',
    cursor: 'default',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
  },
  chip: ({ palette }) => ({
    color: palette.text.primary,
    maxWidth: '100%',
  }),
});

export default LockedScopeList;
