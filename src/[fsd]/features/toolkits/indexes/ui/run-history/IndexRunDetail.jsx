import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { IndexingReportSummary } from '@/[fsd]/entities/indexing-report';
import { IndexHistoryItemsLabels } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { formatDate } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { ContentContainer } from '@/pages/Common';

const IndexRunDetail = memo(props => {
  const { row } = props;
  const styles = indexRunDetailStyles();

  if (!row?.entry) return null;

  return (
    <ContentContainer sx={styles.wrapper}>
      <Box sx={styles.body}>
        <Typography
          variant="headingSmall"
          color="text.primary"
        >
          {IndexHistoryItemsLabels[row.entry.state] || 'Indexed'} — {row.index_name}
        </Typography>
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {formatDate(row.entry.updated_on)}
        </Typography>
        {row.entry.error && (
          <Typography
            variant="bodyMedium"
            color="error.main"
          >
            {row.entry.error}
          </Typography>
        )}
        <IndexingReportSummary source={row.entry} />
      </Box>
    </ContentContainer>
  );
});

IndexRunDetail.displayName = 'IndexRunDetail';

/** @type {MuiSx} */
const indexRunDetailStyles = () => ({
  wrapper: {
    flex: 5,
    minWidth: 0,
    overflow: 'auto',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1.5rem',
  },
});

export default IndexRunDetail;
