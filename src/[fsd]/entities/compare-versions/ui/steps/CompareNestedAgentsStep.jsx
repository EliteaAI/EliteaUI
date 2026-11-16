import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { COMPARE_MESSAGES } from '../../lib/constants/compareVersions.constants';
import { countChangedNestedAgents } from '../../lib/helpers/compareVersions.helpers';
import CompareVersionHeader from '../CompareVersionHeader';
import CompareNestedAgentRow from './CompareNestedAgentRow';

// The sub-agents of the two compared versions and theirs in turn, each with what differs in it
const CompareNestedAgentsStep = memo(props => {
  const { leftVersion, rightVersion, nestedRows = [] } = props;
  const styles = compareNestedAgentsStepStyles;

  const changedCount = useMemo(() => countChangedNestedAgents(nestedRows), [nestedRows]);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.headerRow}>
        <CompareVersionHeader version={leftVersion} />
        <CompareVersionHeader version={rightVersion} />
      </Box>
      <Box sx={styles.scrollable}>
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {COMPARE_MESSAGES.nestedIntro}
        </Typography>
        {nestedRows.length === 0 ? (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.empty}
            data-testid="compare-nested-empty"
          >
            {COMPARE_MESSAGES.nestedNone}
          </Typography>
        ) : (
          <>
            <Typography
              variant="labelMedium"
              color="text.primary"
              data-testid="compare-nested-summary"
            >
              {changedCount === 0
                ? 'No differences in the sub-agents.'
                : `${changedCount} sub-agent${changedCount === 1 ? '' : 's'} differ.`}
            </Typography>
            {nestedRows.map(row => (
              <CompareNestedAgentRow
                key={row.key}
                row={row}
              />
            ))}
          </>
        )}
      </Box>
    </Box>
  );
});

CompareNestedAgentsStep.displayName = 'CompareNestedAgentsStep';

/** @type {MuiSx} */
const compareNestedAgentsStepStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  headerRow: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    padding: '0.75rem 2rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  scrollable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '1rem 2rem 1.5rem',
  },
  empty: {
    fontStyle: 'italic',
  },
};

export default CompareNestedAgentsStep;
