import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { SearchIndexButton, ViewRunHistoryButton } from '@/[fsd]/shared/ui/button';
import { EntityTypeIcon } from '@/components/EntityIcon';

const { PANEL_GUTTER, PANEL_HEADER_HEIGHT } = ToolkitLayoutConstants;

const IndexDetailsLeftBand = memo(props => {
  const {
    indexName,
    historyDisabled = false,
    historyTooltip,
    onShowHistory,
    searchBlockedReason,
    onSearch,
  } = props;
  const styles = indexDetailsLeftBandStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="index-details-left-band"
    >
      <Box sx={styles.identity}>
        <EntityTypeIcon type="index" />
        <Typography
          variant="headingSmall"
          color="text.secondary"
          noWrap
        >
          {indexName}
        </Typography>
      </Box>
      <Box sx={styles.controls}>
        <SearchIndexButton
          disabled={Boolean(searchBlockedReason)}
          tooltip={searchBlockedReason ?? undefined}
          onSearch={onSearch}
        />
        <ViewRunHistoryButton
          disabled={historyDisabled}
          tooltip={historyTooltip}
          testId="index-run-history-button"
          onShowHistory={onShowHistory}
        />
      </Box>
    </Box>
  );
});

IndexDetailsLeftBand.displayName = 'IndexDetailsLeftBand';

/** @type {MuiSx} */
const indexDetailsLeftBandStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    flexShrink: 0,
    height: PANEL_HEADER_HEIGHT,
    padding: `0 ${PANEL_GUTTER}`,
    background: palette.background.section,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  identity: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    overflow: 'hidden',
    '> svg': {
      flexShrink: 0,
    },
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
});

export default IndexDetailsLeftBand;
