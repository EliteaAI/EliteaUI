import { memo } from 'react';

import { Box, Skeleton, Typography } from '@mui/material';

import { TOOLKIT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { IndexingBlockerBanners, IndexingBlockers } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { shouldFetchIndexes } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexingBlocker.helpers';
import { useIndexNavigation, useToolkitIndexes } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import InfoIcon from '@/assets/info.svg?react';

import AddIndexButton from './AddIndexButton';
import IndexesContainer from './IndexesContainer';
import RunIndexBanner from './RunIndexBanner';
import IndexesList from './index-list/IndexesList';

const { PANEL_GUTTER, PANEL_HEADER_HEIGHT } = ToolkitLayoutConstants;

const IndexesPanel = memo(props => {
  const { toolkitId, indexingBlocker } = props;

  const { count, label, isLoading } = useToolkitIndexes(toolkitId);
  const { goToCreateIndex } = useIndexNavigation(toolkitId);

  const styles = indexesPanelStyles();

  const isListFetched = shouldFetchIndexes(indexingBlocker);
  const isCountPending = indexingBlocker === IndexingBlockers.loading || (isListFetched && isLoading);
  const banner = IndexingBlockerBanners[indexingBlocker];

  const renderCount = () => {
    if (isCountPending) {
      return (
        <Skeleton
          variant="text"
          width="1.5rem"
        />
      );
    }

    if (!isListFetched) return null;

    return (
      <Typography
        variant="headingSmall"
        color="text.secondary"
        aria-label={label}
        data-testid="toolkit-indexes-count"
      >
        {`(${count})`}
      </Typography>
    );
  };

  return (
    <Box
      sx={styles.root}
      data-testid="toolkit-indexes-panel"
    >
      <Box
        sx={styles.header}
        data-tour={TOOLKIT_TOUR_TARGET_IDS.indexesTab}
      >
        <Box sx={styles.title}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Indexes
          </Typography>
          {renderCount()}
        </Box>
        {!indexingBlocker && !isLoading && count > 0 && <AddIndexButton onClick={goToCreateIndex} />}
      </Box>
      <Box sx={styles.body}>
        {indexingBlocker === IndexingBlockers.loading ? (
          <IndexesList loading />
        ) : (
          <>
            {banner && (
              <RunIndexBanner
                banner={banner}
                showBottomBorder={false}
                CustomIcon={InfoIcon}
                sx={styles.banner}
              />
            )}
            {isListFetched && (
              <IndexesContainer
                toolkitId={toolkitId}
                canIndex={!indexingBlocker}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
});

IndexesPanel.displayName = 'IndexesPanel';

/** @type {MuiSx} */
const indexesPanelStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  header: ({ palette }) => ({
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
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: 1,
    overflow: 'auto',
    padding: PANEL_GUTTER,
  },
  banner: {
    padding: 0,
    width: '100%',
    flexShrink: 0,
  },
});

export default IndexesPanel;
