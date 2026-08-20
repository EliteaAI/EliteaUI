import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { normalizeIndexingReport } from '@/[fsd]/entities/indexing-report';
import { formatDate, hasLiveRun } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { useProjectType } from '@/[fsd]/shared/lib/hooks/useProjectType.hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ClockIcon from '@/assets/clock.svg?react';
import FileIcon from '@/assets/file.svg?react';
import IndexingIcon from '@/assets/indexing.svg?react';
import UnavailableIcon from '@/assets/unavailable.svg?react';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import IndexStatItem from './IndexStatItem';

const capitalize = word => word.charAt(0).toUpperCase() + word.slice(1);

const summarizeRun = entry => {
  const report = normalizeIndexingReport(entry);
  if (!report) return { itemsLabel: 'Files', indexed: null, skipped: 0 };
  const { indexed, unchanged, leftOut } = report.totals;
  return {
    itemsLabel: capitalize(report.itemLabels.plural),
    // Everything the store holds, and everything left out of it.
    indexed: indexed + unchanged,
    skipped: leftOut,
  };
};

const RunIndexGeneralSection = memo(props => {
  const {
    index,
    reindexStats,
    isRunning,
    isIndexing,
    isStale = false,
    isWaitingForTaskStart = false,
    canStopIndexing = false,
    isDeleting,
    onReindex,
    onOpenDelete,
  } = props;
  const styles = runIndexGeneralSectionStyles();
  const { isPrivate } = useProjectType();
  const { checkPermission } = useCheckPermission();

  const firstRun = useMemo(() => summarizeRun(reindexStats.firstEntry), [reindexStats.firstEntry]);
  const latestRun = useMemo(() => summarizeRun(reindexStats.latestEntry), [reindexStats.latestEntry]);

  const canDeleteIndex = isPrivate || checkPermission(PERMISSIONS.index.delete);
  const runIsLive = hasLiveRun({ isIndexing, canStopIndexing, isStale });

  return (
    <Box sx={styles.root}>
      <Box sx={styles.statsSection}>
        <Box sx={styles.latestSection}>
          <IndexStatItem
            icon={ClockIcon}
            label="Created"
            value={formatDate(reindexStats.createdOn ?? index?.metadata?.created_on)}
            styles={styles}
          />
          <IndexStatItem
            icon={FileIcon}
            label={`${firstRun.itemsLabel} indexed`}
            value={firstRun.indexed ?? index?.metadata?.indexed ?? index?.metadata?.total}
            styles={styles}
          />
          <IndexStatItem
            icon={UnavailableIcon}
            label={`${firstRun.itemsLabel} skipped`}
            value={firstRun.skipped}
            styles={styles}
          />
        </Box>
        {reindexStats.isReindex && (
          <Box sx={styles.lastIndexContainer}>
            <IndexStatItem
              icon={ClockIcon}
              label="Last reindex"
              value={formatDate(reindexStats.updatedOn)}
              styles={styles}
            />
            {latestRun.indexed !== null && (
              <IndexStatItem
                icon={IndexingIcon}
                label={`${latestRun.itemsLabel} reindexed`}
                value={latestRun.indexed}
                styles={styles}
              />
            )}
            <IndexStatItem
              icon={UnavailableIcon}
              label={`${latestRun.itemsLabel} skipped`}
              value={latestRun.skipped}
              styles={styles}
            />
          </Box>
        )}
      </Box>
      <Box sx={styles.actions}>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          onClick={onReindex}
          // isRunning stays in this gate (unlike Delete's): a live non-indexing tool
          // run must not start a concurrent index.
          disabled={isRunning || isWaitingForTaskStart || runIsLive}
        >
          Reindex
        </Button.BaseBtn>
        {canDeleteIndex && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            onClick={onOpenDelete}
            // No isRunning here — recovering an in-progress conversation on page load
            // sets it too, which is the stuck case this escape hatch exists for.
            disabled={isDeleting || isWaitingForTaskStart || runIsLive}
          >
            Delete Index
          </Button.BaseBtn>
        )}
      </Box>
    </Box>
  );
});

RunIndexGeneralSection.displayName = 'RunIndexGeneralSection';

/** @type {MuiSx} */
const runIndexGeneralSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingBottom: '1.5rem',
  },
  avatar: {
    width: '2.25rem',
    height: '2.25rem',
    minWidth: '2.25rem',
    borderRadius: '1.75rem',
    border: '0.0625rem solid rgba(156, 169, 178, 0)',
    background: 'linear-gradient(45deg, rgba(169, 183, 193, 0.3) 16.25%, rgba(169, 183, 193, 0.09) 87.07%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    fill: palette.icon.fill.primary,
  }),
  statsSection: {
    display: 'flex',
    gap: '0.25rem',
  },
  latestSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0.5rem 0',
  },
  lastIndexContainer: {
    flex: 1,
    borderRadius: '0.5rem',
    border: ({ palette }) => `0.0625rem solid ${palette.border.reindexInfoContainer}`,
    padding: '0.5rem',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    paddingTop: '0.5rem',
  },
});

export default RunIndexGeneralSection;
