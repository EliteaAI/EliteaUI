import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const COLUMNS = [
  { key: 'label', label: 'Agent' },
  { key: 'llmCalls', label: 'LLM calls' },
  { key: 'toolCalls', label: 'Tool calls' },
  { key: 'inputTokens', label: 'Input tokens' },
  { key: 'outputTokens', label: 'Output tokens' },
  { key: 'cost', label: 'Cost' },
  { key: 'source', label: 'Source' },
];

// What each agent of a case did and spent (#7015 P3): the agent under test, then its sub-agents.
const AgentUsage = memo(props => {
  const { rows, note } = props;
  return (
    <Box
      sx={STYLES.container}
      data-testid="case-agent-usage"
    >
      <Typography
        variant="labelSmall"
        sx={STYLES.title}
      >
        By agent
      </Typography>
      <Box
        sx={STYLES.table}
        role="table"
        aria-label="Usage by agent"
      >
        <Box
          sx={STYLES.row}
          role="row"
        >
          {COLUMNS.map(({ key, label }) => (
            <Typography
              key={key}
              variant="labelSmall"
              sx={STYLES.header}
              role="columnheader"
            >
              {label}
            </Typography>
          ))}
        </Box>
        {rows.map(row => (
          <Box
            key={row.key}
            sx={STYLES.row}
            role="row"
            data-testid={`case-agent-usage-${row.key}`}
          >
            {COLUMNS.map(({ key }) => (
              <Typography
                key={key}
                variant="bodySmall"
                role="cell"
              >
                {row[key]}
              </Typography>
            ))}
          </Box>
        ))}
      </Box>
      {note && (
        <Typography
          variant="bodySmall"
          sx={STYLES.note}
        >
          {note}
        </Typography>
      )}
    </Box>
  );
});

AgentUsage.displayName = 'AgentUsage';

/** @type {MuiSx} */
const agentUsageStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
  }),
  title: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }),
  table: {
    display: 'grid',
    gridTemplateColumns: 'minmax(8rem, 2fr) repeat(6, minmax(0, 1fr))',
    columnGap: '1rem',
    rowGap: '0.25rem',
  },
  header: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  row: {
    display: 'contents',
  },
  note: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

// Static, so built once rather than on every render.
const STYLES = agentUsageStyles();

export default AgentUsage;
