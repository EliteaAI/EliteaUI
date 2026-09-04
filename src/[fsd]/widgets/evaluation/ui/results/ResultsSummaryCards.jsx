import { memo, useMemo } from 'react';

import { Box, Typography, alpha } from '@mui/material';

import { formatScore } from '../../lib/helpers';

// Labels are uppercased by CSS and truncate with an ellipsis when the card is too
// narrow, so the full text is kept here rather than clipped by hand.
const CARD_CONFIG = {
  totalScore: { label: 'Total score', isHighlighted: true },
  cases: { label: 'Cases' },
  metAllTargets: { label: 'Met all targets' },
  missed: { label: 'Missed' },
  errors: { label: 'Errors' },
};

const ResultsSummaryCards = memo(props => {
  const { totalScore, cases, metAllTargets, missed, errors, hasPendingHuman = false } = props;

  const cards = useMemo(
    () => [
      { key: 'totalScore', value: totalScore },
      { key: 'cases', value: cases },
      { key: 'metAllTargets', value: metAllTargets },
      { key: 'missed', value: missed },
      { key: 'errors', value: errors },
    ],
    [totalScore, cases, metAllTargets, missed, errors],
  );

  const styles = resultsSummaryCardsStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-results-summary"
    >
      {cards.map(({ key, value }) => {
        const config = CARD_CONFIG[key];
        const isHighlighted = config.isHighlighted;
        const displayValue = key === 'totalScore' ? formatScore(value) : value != null ? String(value) : '—';

        return (
          <Box
            key={key}
            sx={[styles.card, isHighlighted && styles.cardHighlighted]}
            data-testid={`evaluation-summary-${key}`}
          >
            <Typography
              variant="bodySmall2"
              sx={[styles.cardLabel, isHighlighted && styles.cardLabelHighlighted]}
            >
              {config.label}
            </Typography>
            <Typography
              variant="headingMedium"
              sx={[styles.cardValue, isHighlighted && styles.cardValueHighlighted]}
            >
              {displayValue}
            </Typography>
          </Box>
        );
      })}
      {hasPendingHuman && (
        <Typography
          variant="bodySmall"
          sx={styles.pendingNote}
        >
          * Some human dimensions are pending scores
        </Typography>
      )}
    </Box>
  );
});

ResultsSummaryCards.displayName = 'ResultsSummaryCards';

/** @type {MuiSx} */
const resultsSummaryCardsStyles = () => ({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '0.75rem',
    padding: '0.875rem 1.5rem',
  },
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    height: '3.875rem',
    padding: '0.5625rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.tabButton.default,
    boxSizing: 'border-box',
  }),
  cardHighlighted: ({ palette }) => ({
    backgroundColor: alpha(palette.primary.main, 0.15),
  }),
  cardLabel: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: palette.text.default,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  cardLabelHighlighted: ({ palette }) => ({
    color: palette.primary.main,
  }),
  cardValue: ({ palette }) => ({
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
  cardValueHighlighted: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  pendingNote: ({ palette }) => ({
    gridColumn: '1 / -1',
    marginTop: '0.25rem',
    color: palette.text.default,
    fontStyle: 'italic',
  }),
});

export default ResultsSummaryCards;
