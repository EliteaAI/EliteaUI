import { memo, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { buildRunHistory } from '../../lib/helpers';
import RunHistoryRow from './RunHistoryRow';

const COLLAPSED_COUNT = 5;

const RunHistoryList = memo(props => {
  const { runs = [], onViewResults } = props;

  const [expanded, setExpanded] = useState(false);

  const history = useMemo(() => buildRunHistory(runs), [runs]);
  const visible = expanded ? history : history.slice(0, COLLAPSED_COUNT);

  const styles = runHistoryListStyles();

  if (!history.length) return null;

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-run-history"
    >
      <Typography variant="labelMedium">Run history</Typography>
      <Typography
        variant="bodySmall2"
        color="text.secondary"
      >
        Score change against the previous scored run.
      </Typography>

      <Box sx={styles.list}>
        {visible.map(run => (
          <RunHistoryRow
            key={run.id}
            run={run}
            onViewResults={onViewResults}
          />
        ))}
      </Box>

      {history.length > COLLAPSED_COUNT && (
        <Box sx={styles.actions}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.text}
            color={BUTTON_COLORS.secondary}
            onClick={() => setExpanded(prev => !prev)}
            data-testid="evaluation-run-history-toggle"
          >
            {expanded ? 'Show less' : `Show all ${history.length}`}
          </Button.BaseBtn>
        </Box>
      )}
    </Box>
  );
});

RunHistoryList.displayName = 'RunHistoryList';

/** @type {MuiSx} */
const runHistoryListStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  list: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '0.5rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

export default RunHistoryList;
