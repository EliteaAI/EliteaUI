import { memo, useMemo, useState } from 'react';

import { Box, Collapse, Typography } from '@mui/material';

import {
  IndexingReportSummary,
  parseIndexEntryJson,
  resolveIndexingReport,
} from '@/[fsd]/entities/indexing-report';
import { formatRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import { IndexStatuses, IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { budgetErrorMessage } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { ContentContainer } from '@/pages/Common';

const INITIATOR_LABELS = { schedule: 'Schedule', llm: 'Agent' };

const IndexRunDetail = memo(props => {
  const { row } = props;
  const styles = indexRunDetailStyles();

  const [showConfiguration, setShowConfiguration] = useState(false);

  const isCreationEvent = row?.entry?.state === IndexStatuses.created;

  const startedBy = INITIATOR_LABELS[row?.entry?.initiator];

  const configuration = useMemo(() => parseIndexEntryJson(row?.entry?.index_configuration), [row]);

  const report = useMemo(
    () => (isCreationEvent ? null : resolveIndexingReport(row?.entry)),
    [isCreationEvent, row?.entry],
  );

  const budgetMessage = budgetErrorMessage(row?.entry?.error);
  const showStoredError = Boolean(row?.entry?.error) && (Boolean(budgetMessage) || !report?.errors?.length);

  const producingTool = isCreationEvent ? null : IndexesToolsEnum.indexData;

  if (!row?.entry) return null;

  return (
    <ContentContainer sx={styles.wrapper}>
      <Box sx={styles.body}>
        <Typography
          variant="headingSmall"
          color="text.primary"
        >
          {row.name}
        </Typography>
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {isCreationEvent
            ? formatRunTimestamp(row.entry.updated_on)
            : `Finished ${formatRunTimestamp(row.entry.updated_on)}`}
        </Typography>
        {startedBy && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            Started by {startedBy}
          </Typography>
        )}
        {producingTool && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            Tool: {producingTool}
          </Typography>
        )}
        {showStoredError && (
          <Typography
            variant="bodyMedium"
            color="error.main"
          >
            {budgetMessage || row.entry.error}
          </Typography>
        )}
        {report && <IndexingReportSummary source={report} />}
        {configuration && (
          <Box sx={styles.configuration}>
            <BaseBtn
              data-testid="index-run-configuration-toggle"
              variant="text"
              size="small"
              onClick={() => setShowConfiguration(prev => !prev)}
            >
              {showConfiguration ? 'Hide request parameters' : 'Show request parameters'}
            </BaseBtn>
            <Collapse in={showConfiguration}>
              <Typography
                component="pre"
                variant="bodySmall"
                sx={styles.configurationContent}
                data-testid="index-run-configuration"
              >
                {JSON.stringify(configuration, null, 2)}
              </Typography>
            </Collapse>
          </Box>
        )}
      </Box>
    </ContentContainer>
  );
});

IndexRunDetail.displayName = 'IndexRunDetail';

/** @type {MuiSx} */
const indexRunDetailStyles = () => ({
  wrapper: {
    flex: 7,
    minWidth: 0,
    overflow: 'auto',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1.5rem',
  },
  configuration: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  configurationContent: ({ palette }) => ({
    margin: 0,
    padding: '0.75rem',
    width: '100%',
    boxSizing: 'border-box',
    overflowX: 'auto',
    whiteSpace: 'pre',
    color: palette.text.secondary,
    backgroundColor: palette.background.userInputBackground,
    borderRadius: '0.5rem',
  }),
});

export default IndexRunDetail;
