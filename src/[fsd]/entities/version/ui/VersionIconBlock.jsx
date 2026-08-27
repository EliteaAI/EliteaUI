import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import PublishIcon from '@/assets/publish-version.svg?react';
import PinIcon from '@/components/Icons/PinIcon';

const VersionIconBlock = memo(props => {
  const { status, id, defaultVersionID, handleSetDefaultVersion, name } = props;

  const styles = versionIconBlockStyles();

  const disableSetAsADefault = () => {
    if (defaultVersionID === id) return true;
    if (!defaultVersionID && name === 'base') return true;
    if (status === 'published') return true;
    return false;
  };

  if (status === 'published')
    return (
      <Box sx={styles.publishedIconBox}>
        <PublishIcon sx={styles.iconSm} />
      </Box>
    );

  if (defaultVersionID === id)
    return (
      <Tooltip
        title="Default version"
        placement="top"
      >
        <Box
          aria-label="Default version"
          data-testid="version-option-pin-icon"
          sx={styles.pinIconBox}
        >
          <PinIcon sx={styles.iconSm} />
        </Box>
      </Tooltip>
    );

  if (handleSetDefaultVersion && !disableSetAsADefault())
    return (
      <Tooltip
        title="Set as default"
        placement="top"
      >
        <Box
          id="show-on-hover"
          aria-label="Set as default"
          data-testid={`version-option-set-default-${name}`}
          sx={styles.setDefaultBox}
          onClick={e => {
            e.stopPropagation();
            handleSetDefaultVersion(id);
          }}
        >
          <PinIcon sx={styles.iconSm} />
        </Box>
      </Tooltip>
    );

  return null;
});

VersionIconBlock.displayName = 'VersionIconBlock';

/** @type {MuiSx} */
export const versionIconBlockStyles = () => ({
  publishedIconBox: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    svg: { path: { fill: `${palette.icon.fill.success} !important` } },
  }),
  pinIconBox: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    width: '1rem',
    height: '1rem',
    svg: { path: { fill: `${palette.icon.fill.secondary} !important` } },
  }),
  setDefaultBox: ({ palette }) => ({
    display: 'none',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative',
    marginLeft: '0.25rem',
    svg: { path: { fill: `${palette.icon.fill.secondary} !important` } },
    '&:hover': {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '1.75rem',
        height: '1.75rem',
        backgroundColor: palette.action.hover,
        borderRadius: '50%',
      },
    },
  }),
  iconSm: {
    fontSize: '1rem',
  },
});

export default VersionIconBlock;
