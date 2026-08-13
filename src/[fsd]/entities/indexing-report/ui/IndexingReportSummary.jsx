import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { INDEXING_REPORT_KIND_PRESENTATION } from '../lib/constants/indexingReport.constants';
import {
  categoryHeadline,
  reportHeadline,
  unchangedNotice,
  visibleCategories,
} from '../lib/helpers/indexingReport.helpers';
import { normalizeIndexingReport } from '../lib/serialize/indexingReport.serialize';

const IndexingReportSummary = memo(props => {
  const { source, sx = {} } = props;

  const report = useMemo(() => (source?.categories ? source : normalizeIndexingReport(source)), [source]);
  const categories = useMemo(() => (report ? visibleCategories(report) : []), [report]);
  const headline = useMemo(() => (report ? reportHeadline(report) : null), [report]);
  const unchanged = useMemo(() => (report ? unchangedNotice(report) : null), [report]);

  const styles = indexingReportSummaryStyles();

  if (!report) return null;

  return (
    <Box
      sx={[styles.root, sx]}
      data-testid="indexing-report-summary"
    >
      {headline && (
        <Typography
          variant="bodyMedium"
          sx={styles.headline}
        >
          {headline.icon} {headline.text}
        </Typography>
      )}

      {categories.map(category => {
        const { tone } = INDEXING_REPORT_KIND_PRESENTATION[category.kind];
        const { icon, text } = categoryHeadline(category, report);
        return (
          <Box
            key={category.kind}
            sx={styles.category}
            data-testid={`indexing-report-category-${category.kind}`}
          >
            <Typography
              variant="bodyMedium"
              sx={styles.categoryTitle(tone)}
            >
              {icon} {text}
            </Typography>

            {category.groups.map(group => (
              <Box
                key={`${group.reason}-${group.dependent}`}
                sx={styles.group}
              >
                <Typography
                  variant="bodySmall"
                  sx={styles.groupLabel}
                >
                  {group.label} ({group.count})
                </Typography>
                {group.items.map(item => (
                  <Typography
                    key={item}
                    variant="bodySmall"
                    sx={styles.item}
                  >
                    {item}
                  </Typography>
                ))}
                {group.more > 0 && (
                  <Typography
                    variant="bodySmall"
                    sx={styles.item}
                  >
                    … and {group.more} more
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        );
      })}

      {unchanged && (
        <Typography
          variant="bodyMedium"
          sx={styles.unchanged}
          data-testid="indexing-report-unchanged"
        >
          {unchanged.text}
        </Typography>
      )}

      {report.errors.length > 0 && (
        <Box
          sx={styles.category}
          data-testid="indexing-report-errors"
        >
          <Typography
            variant="bodyMedium"
            sx={styles.categoryTitle('error')}
          >
            Errors
          </Typography>
          {report.errors.map(message => (
            <Typography
              key={message}
              variant="bodySmall"
              sx={styles.item}
            >
              {message}
            </Typography>
          ))}
          {report.errorsTotal > report.errors.length && (
            <Typography
              variant="bodySmall"
              sx={styles.item}
            >
              … and {report.errorsTotal - report.errors.length} more distinct errors
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
});

IndexingReportSummary.displayName = 'IndexingReportSummary';

/** @type {MuiSx} */
const indexingReportSummaryStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  headline: ({ palette }) => ({
    color: palette.text.primary,
  }),
  category: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  categoryTitle:
    tone =>
    ({ palette }) => ({
      color: palette[tone]?.main || palette.text.primary,
    }),
  group: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '1rem',
  },
  groupLabel: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  unchanged: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  item: ({ palette }) => ({
    color: palette.text.secondary,
    paddingLeft: '1rem',
  }),
});

export default IndexingReportSummary;
