import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

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
  if (version.author?.name) {
    parts.push(`by ${version.author.name}`);
  }
  return parts.length ? parts.join(' · ') : null;
};

const CompareVersionHeader = memo(props => {
  const { version } = props;
  const meta = useMemo(() => formatVersionMeta(version), [version]);

  return (
    <Box sx={styles.root}>
      <Typography
        variant="labelMedium"
        color="text.secondary"
      >
        {version?.name}
      </Typography>
      {meta && (
        <Typography
          variant="labelSmall"
          color="text.primary"
        >
          {meta}
        </Typography>
      )}
    </Box>
  );
});

CompareVersionHeader.displayName = 'CompareVersionHeader';

/** @type {MuiSx} */
const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    lineHeight: '1',
  },
};

export default CompareVersionHeader;
