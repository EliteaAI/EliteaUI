import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';

const AnalyticsGuide = memo(() => {
  const styles = analyticsGuideStyles();

  return (
    <Box sx={styles.analyticsGuideContent}>
      {AnalyticsCommonConstants.GUIDE_SECTIONS.map((section, si) => (
        <Box
          key={si}
          sx={styles.chartCard}
          data-testid="analytics-guide-section"
        >
          <Typography
            variant="labelMedium"
            sx={styles.guideSection}
            data-testid="analytics-guide-section-title"
          >
            {section.title}
          </Typography>
          {section.metrics.map((m, mi) => (
            <Box
              key={mi}
              sx={styles.guideItem}
              data-testid="analytics-guide-metric"
            >
              <Typography
                variant="bodyMedium"
                sx={styles.guideName}
                data-testid="analytics-guide-metric-name"
              >
                {m.name}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={styles.guideDescription}
                data-testid="analytics-guide-metric-description"
              >
                {m.description}
              </Typography>
              {m.calculation && (
                <Box sx={styles.guideCalcRow}>
                  <Typography
                    variant="labelSmall"
                    sx={styles.guideCalcLabel}
                  >
                    Calculation:
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={styles.guideCalcValue}
                    data-testid="analytics-guide-metric-calculation-value"
                  >
                    {m.calculation}
                  </Typography>
                </Box>
              )}
              {m.source && (
                <Box sx={styles.guideCalcRow}>
                  <Typography
                    variant="labelSmall"
                    sx={styles.guideCalcLabel}
                  >
                    Data source:
                  </Typography>
                  <Typography
                    variant="bodySmall"
                    sx={styles.guideCalcValue}
                    data-testid="analytics-guide-metric-source-value"
                  >
                    {m.source}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
});

AnalyticsGuide.displayName = 'AnalyticsGuide';

/** @type {MuiSx} */
const analyticsGuideStyles = () => ({
  analyticsGuideContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  chartCard: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `1px solid ${palette.border.table}`,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  guideSection: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: `1px solid ${palette.border.table}`,
  }),
  guideItem: ({ palette }) => ({
    padding: '0.75rem 0',
    borderBottom: `1px solid ${palette.border.table}`,
    '&:last-child': { borderBottom: 'none' },
  }),
  guideName: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    marginBottom: '0.375rem',
    display: 'block',
  }),
  guideDescription: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    lineHeight: 1.6,
    whiteSpace: 'pre-line',
  }),
  guideCalcRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'baseline',
    marginTop: '0.375rem',
  },
  guideCalcLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.6875rem',
    fontWeight: 600,
    flexShrink: 0,
  }),
  guideCalcValue: {
    color: '#58A6FF',
    fontSize: '0.8125rem',
  },
});

export default AnalyticsGuide;
