import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import YamlNodeSummaryChip from './YamlNodeSummaryChip';

const SUMMARY_KINDS = ['added', 'removed', 'changed'];

// The line counters, the node summary and the change navigator above the two YAML editors
const YamlDiffToolbar = memo(props => {
  const {
    addedLines,
    removedLines,
    changeCount,
    activeChange,
    nodeSummary,
    onPreviousChange,
    onNextChange,
    onSelectNode,
  } = props;
  const styles = yamlDiffToolbarStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="compare-yaml-toolbar"
    >
      <Typography
        variant="bodySmall"
        sx={styles.counter}
        data-testid="compare-yaml-line-counter"
      >
        <Box
          component="span"
          sx={styles.added}
        >{`+${addedLines}`}</Box>{' '}
        <Box
          component="span"
          sx={styles.removed}
        >{`−${removedLines}`}</Box>{' '}
        lines
      </Typography>

      {nodeSummary?.error && (
        <Typography
          variant="bodySmall"
          sx={styles.summaryError}
          data-testid="compare-yaml-node-summary-error"
        >
          {nodeSummary.error}
        </Typography>
      )}
      {nodeSummary && !nodeSummary.error && (
        <Box
          sx={styles.chips}
          data-testid="compare-yaml-node-summary"
        >
          {SUMMARY_KINDS.filter(kind => nodeSummary[kind]?.length).map(kind => (
            <YamlNodeSummaryChip
              key={kind}
              kind={kind}
              ids={nodeSummary[kind]}
              onSelectNode={onSelectNode}
            />
          ))}
        </Box>
      )}

      <Box sx={styles.navigator}>
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          disabled={activeChange <= 0}
          onClick={onPreviousChange}
          data-testid="compare-yaml-previous-change"
        >
          Previous change
        </BaseBtn>
        <Typography
          variant="bodySmall"
          sx={styles.position}
          aria-live="polite"
          data-testid="compare-yaml-change-position"
        >
          {`Change ${activeChange + 1} of ${changeCount}`}
        </Typography>
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          disabled={activeChange >= changeCount - 1}
          onClick={onNextChange}
          data-testid="compare-yaml-next-change"
        >
          Next change
        </BaseBtn>
      </Box>
    </Box>
  );
});

YamlDiffToolbar.displayName = 'YamlDiffToolbar';

/** @type {MuiSx} */
const yamlDiffToolbarStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    padding: '0.75rem 2rem 0',
  },
  counter: ({ palette }) => ({
    color: palette.text.primary,
    whiteSpace: 'nowrap',
  }),
  added: ({ palette }) => ({ color: palette.text.success }),
  removed: ({ palette }) => ({ color: palette.text.error }),
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  summaryError: ({ palette }) => ({
    color: palette.text.warning,
  }),
  navigator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: 'auto',
  },
  position: ({ palette }) => ({
    color: palette.text.primary,
    whiteSpace: 'nowrap',
  }),
});

export default YamlDiffToolbar;
