import { memo } from 'react';

import { Typography } from '@mui/material';
import { Box } from '@mui/system';

import ClockIcon from '@/assets/clock.svg?react';

import PendingInjectionItem from './PendingInjectionItem';

const PendingInjectionList = memo(props => {
  const { items, onRemove } = props;

  if (!items.length) return null;

  const styles = pendingInjectionListStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="interjection-queue-area"
    >
      <Box
        sx={styles.header}
        data-testid="interjection-queue-label"
      >
        <ClockIcon sx={styles.headerIcon} />
        <Typography
          variant="bodySmall"
          color={'text.metrics'}
        >{`Waiting messages – ${items.length}`}</Typography>
      </Box>
      {items.map(item => (
        <PendingInjectionItem
          key={item.id}
          item={item}
          onRemove={onRemove}
        />
      ))}
    </Box>
  );
});

PendingInjectionList.displayName = 'PendingInjectionList';

/** @type {MuiSx} */
const pendingInjectionListStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '.5rem 0.75rem 0 0.75rem',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0em 0.25rem',
    height: '1.25rem',
    color: ({ palette }) => palette.icon.fill.secondary,
  },
  headerIcon: {
    fontSize: '1rem',
  },
});

export default PendingInjectionList;
