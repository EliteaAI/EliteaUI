import { Box } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { VersionAuthorAvatar } from '@/[fsd]/entities/version/ui';
import PublishIcon from '@/assets/publish-version.svg?react';
import { TIME_FORMAT } from '@/common/constants';
import { timeFormatter } from '@/common/utils';
import PinIcon from '@/components/Icons/PinIcon';

export const buildVersionOption =
  ({ enableVersionListAvatar, defaultVersionID, handleSetDefaultVersion }) =>
  ({ name, id, created_at, author = {}, status }) => {
    const displayName = author.name;
    const avatar = author.avatar;

    const disableSetAsADefault = () => {
      if (defaultVersionID === id) return true;
      if (!defaultVersionID && name === LATEST_VERSION_NAME) return true;
      if (status === 'published') return true;

      return false;
    };

    const IconBlock = () => {
      if (enableVersionListAvatar)
        return (
          <VersionAuthorAvatar
            name={displayName}
            avatar={avatar}
          />
        );

      if (status === 'published')
        return (
          <Box
            sx={({ palette }) => ({
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',

              svg: { path: { fill: `${palette.icon.fill.success} !important` } },
            })}
          >
            <PublishIcon sx={{ fontSize: '1rem' }} />
          </Box>
        );
      if (defaultVersionID === id) return <PinIcon />;

      if (handleSetDefaultVersion && !disableSetAsADefault())
        return (
          <Box
            id="show-on-hover"
            sx={({ palette }) => ({
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
            })}
            onClick={() => handleSetDefaultVersion(id)}
          >
            <PinIcon sx={{ fontSize: '1rem' }} />
          </Box>
        );

      return null;
    };

    return {
      label: name,
      value: id,
      date: timeFormatter(created_at, TIME_FORMAT.DDMMYYYY),
      icon: <IconBlock />,
    };
  };
