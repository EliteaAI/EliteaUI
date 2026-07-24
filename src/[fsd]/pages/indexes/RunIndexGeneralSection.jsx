import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { formatDate } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ClockIcon from '@/assets/clock.svg?react';
import FileIcon from '@/assets/file.svg?react';
import IndexingIcon from '@/assets/indexing.svg?react';
import UnavailableIcon from '@/assets/unavailable.svg?react';
import EntityIcon from '@/components/EntityIcon';

const StatItem = memo(props => {
  const { icon: Icon, label, value, styles } = props;
  return (
    <Box sx={styles.statItem}>
      <Box sx={styles.statLabel}>
        <Icon sx={styles.statIcon} />
        <Typography
          variant="bodyMedium"
          color="text.primary"
          noWrap
        >
          {label}:
        </Typography>
      </Box>
      <Box sx={styles.statValue}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          noWrap
        >
          {value ?? '—'}
        </Typography>
      </Box>
    </Box>
  );
});

StatItem.displayName = 'StatItem';

const RunIndexGeneralSection = memo(props => {
  const { indexName, index, reindexStats, isRunning, isIndexing, isDeleting, onReindex, onOpenDelete } =
    props;
  const styles = runIndexGeneralSectionStyles();
  //
  return (
    <Box sx={styles.root}>
      <Box sx={styles.nameRow}>
        <EntityIcon
          entityType="index"
          projectId={index?.metadata?.project_id}
          editable={false}
        />
        <Typography
          variant="headingSmall"
          color="text.primary"
          noWrap
        >
          {indexName}
        </Typography>
      </Box>
      <Box sx={styles.statsSection}>
        <Box sx={styles.latestSection}>
          <StatItem
            icon={ClockIcon}
            label="Created"
            value={formatDate(index?.metadata?.created_on)}
            styles={styles}
          />
          <StatItem
            icon={FileIcon}
            label="Files indexed"
            value={index?.metadata?.total ?? index?.metadata?.indexed}
            styles={styles}
          />
          <StatItem
            icon={UnavailableIcon}
            label="Files skipped"
            value={reindexStats.skipped > 0 ? reindexStats.skipped : 0}
            styles={styles}
          />
        </Box>
        {reindexStats.isReindex && (
          <Box sx={styles.lastIndexContainer}>
            <StatItem
              icon={ClockIcon}
              label="Last reindex"
              value={formatDate(reindexStats.updatedOn)}
              styles={styles}
            />
            {reindexStats.updated !== null && (
              <StatItem
                icon={IndexingIcon}
                label="Files reindexed"
                value={reindexStats.updated}
                styles={styles}
              />
            )}
            <StatItem
              icon={UnavailableIcon}
              label="Files skipped"
              value={reindexStats.skipped}
              styles={styles}
            />
          </Box>
        )}
      </Box>
      <Box sx={styles.actions}>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          onClick={onReindex}
          disabled={isRunning || isIndexing}
        >
          Reindex
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          onClick={onOpenDelete}
          disabled={isDeleting || isIndexing}
        >
          Delete Index
        </Button.BaseBtn>
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
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    paddingBottom: '0.25rem',
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
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
  },
  statLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    flexShrink: 0,
    color: ({ palette }) => palette.icon.fill.disabled,
  },
  statIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
    color: palette.icon.fill.disabled,
  }),
  statValue: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    borderRadius: '1rem',
    minWidth: 0,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    paddingTop: '0.5rem',
  },
});

export default RunIndexGeneralSection;
