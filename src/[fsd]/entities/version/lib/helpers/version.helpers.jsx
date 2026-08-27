import { Box, Tooltip } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import PublishIcon from '@/assets/publish-version.svg?react';
import PinIcon from '@/components/Icons/PinIcon';

// Formats a version object into a combined "Aug 20, 2026, 02:45 · by Sarah Smith" string.
export const formatVersionMeta = version => {
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
  const authorName = version.author_name ?? version.author_email ?? version.author?.name;
  if (authorName) parts.push(`by ${authorName}`);
  return parts.length ? parts.join(' · ') : null;
};

export const buildVersionOption =
  ({ enableVersionListAvatar, defaultVersionID, handleSetDefaultVersion }) =>
  ({ name, id, created_at, author = {}, author_name, author_email, status }) => {
    const avatar = author.avatar;

    const disableSetAsADefault = () => {
      if (defaultVersionID === id) return true;
      if (!defaultVersionID && name === LATEST_VERSION_NAME) return true;
      if (status === 'published') return true;

      return false;
    };

    const styles = iconBlockStyles();

    const IconBlock = () => {
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
    };

    return {
      label: name,
      value: id,
      date: formatVersionMeta({ created_at, author_name }),
      versionMeta: formatVersionMeta({ created_at, author_name }),
      versionAvatar: enableVersionListAvatar ? avatar : undefined,
      icon: <IconBlock />,
      // Combined lowercase search text (version name + creator) for multi-field search filtering.
      searchText: `${name} ${author_name ?? ''} ${author_email ?? ''}`.toLowerCase(),
      testId: `version-option-${name}`,
    };
  };

/** @type {MuiSx} */
const iconBlockStyles = () => ({
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
