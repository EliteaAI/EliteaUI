import { memo } from 'react';

import { Box, Typography } from '@mui/material';

// By name only: the `trajectory.tool_match` dimension owns the score, args and match-mode rules.
const ExpectedVsActual = memo(props => {
  const { comparison } = props;
  const styles = expectedVsActualStyles();
  const line = (key, ok, text) => (
    <Typography
      key={key}
      variant="bodySmall"
      sx={ok ? undefined : styles.stepError}
      data-testid={key}
    >
      {ok ? '✓' : '✗'} {text}
    </Typography>
  );
  return (
    <Box
      sx={styles.expected}
      data-testid="case-expected-trajectory"
    >
      <Typography
        variant="labelSmall"
        sx={styles.metricLabel}
      >
        Expected vs actual ({comparison.match})
      </Typography>
      {comparison.tools.length === 0 && (
        <Typography
          variant="bodySmall"
          sx={styles.stepMeta}
        >
          No expected tool calls.
        </Typography>
      )}
      {comparison.tools.map((tool, index) =>
        line(
          `expected-tool-${index}`,
          tool.called,
          `${tool.name}${tool.hasArgs ? ' (with args)' : ''}: ${tool.called ? 'called' : 'not called'}`,
        ),
      )}
      {comparison.forbidden.map(tool =>
        line(
          `forbidden-tool-${tool.name}`,
          !tool.called,
          `${tool.name} is forbidden: ${tool.called ? 'called' : 'not called'}`,
        ),
      )}
      {comparison.budget &&
        line(
          'expected-budget',
          comparison.budget.ok,
          `${comparison.budget.used} of at most ${comparison.budget.max} tool calls`,
        )}
      {comparison.extra.length > 0 && (
        <Typography
          variant="bodySmall"
          sx={styles.stepMeta}
          data-testid="expected-extra-tools"
        >
          Also called: {comparison.extra.join(', ')}
        </Typography>
      )}
      <Typography
        variant="bodySmall"
        sx={styles.stepMeta}
      >
        Matched by tool name; the trajectory dimensions apply the match mode and arguments.
      </Typography>
    </Box>
  );
});

ExpectedVsActual.displayName = 'ExpectedVsActual';

/** @type {MuiSx} */
const expectedVsActualStyles = () => ({
  metricLabel: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }),
  expected: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
  }),
  stepMeta: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  stepError: ({ palette }) => ({
    color: palette.error.main,
  }),
});

export default ExpectedVsActual;
