import { memo } from 'react';

import { Box } from '@mui/material';

import { VersionAuthorAvatar } from '@/[fsd]/entities/version/ui';
import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';

const VersionSelectOption = memo(props => {
  const { name, meta, avatar, icon } = props;

  const styles = versionSelectOptionStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.leftSection}>
        <Box sx={styles.row}>
          <TypographyWithConditionalTooltip
            title={name}
            placement="top"
            variant="labelMedium"
            color="text.secondary"
            sx={styles.name}
          >
            {name}
          </TypographyWithConditionalTooltip>
        </Box>
        <Box sx={styles.metaRow}>
          {avatar && (
            <VersionAuthorAvatar
              name={name}
              avatar={avatar}
            />
          )}
          {meta && (
            <TypographyWithConditionalTooltip
              title={meta}
              placement="top"
              variant="labelSmall"
              color="text.primary"
              sx={styles.meta}
            >
              {meta}
            </TypographyWithConditionalTooltip>
          )}
        </Box>
      </Box>
      {icon && <Box sx={styles.iconSlot}>{icon}</Box>}
    </Box>
  );
});

VersionSelectOption.displayName = 'VersionSelectOption';

/** @type {MuiSx} */
const versionSelectOptionStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.25rem',
    flex: 1,
    minWidth: 0,
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    paddingRight: '0.25rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.25rem',
    width: '100%',
  },
  name: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  iconSlot: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    overflow: 'hidden',
    minWidth: 0,
  },
  meta: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
});

export default VersionSelectOption;
