import { memo } from 'react';

import { Box, Button, Typography } from '@mui/material';

import { formatDate } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { useProjectType } from '@/[fsd]/shared/lib/hooks/useProjectType.hooks';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const RunIndexGeneralSection = memo(props => {
  const { indexName, index, reindexStats, isRunning, isIndexing, isDeleting, onReindex, onOpenDelete } =
    props;
  const styles = runIndexGeneralSectionStyles();
  const { isPrivate } = useProjectType();
  const { checkPermission } = useCheckPermission();

  const canDeleteIndex = isPrivate || checkPermission(PERMISSIONS.index.delete);

  return (
    <Box sx={styles.generalGrid}>
      <Box sx={styles.generalRow}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Name
        </Typography>
        <Typography variant="bodyMedium">{indexName}</Typography>
      </Box>
      <Box sx={styles.generalRow}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Created
        </Typography>
        <Typography variant="bodyMedium">{formatDate(index?.metadata?.created_on)}</Typography>
      </Box>
      <Box sx={styles.generalRow}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Files indexed
        </Typography>
        <Typography variant="bodyMedium">
          {index?.metadata?.total ?? index?.metadata?.indexed ?? '—'}
        </Typography>
      </Box>
      {reindexStats.isReindex && (
        <Box sx={styles.generalRow}>
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Last reindex
          </Typography>
          <Typography variant="bodyMedium">{formatDate(reindexStats.updatedOn)}</Typography>
        </Box>
      )}
      {reindexStats.isReindex && reindexStats.updated !== null && (
        <Box sx={styles.generalRow}>
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Files reindexed
          </Typography>
          <Typography variant="bodyMedium">{reindexStats.updated}</Typography>
        </Box>
      )}
      {reindexStats.skipped > 0 && (
        <Box sx={styles.generalRow}>
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Files skipped
          </Typography>
          <Typography variant="bodyMedium">{reindexStats.skipped}</Typography>
        </Box>
      )}
      <Box sx={styles.generalActions}>
        <Button
          variant="special"
          onClick={onReindex}
          disabled={isRunning || isIndexing}
        >
          Reindex
        </Button>
        {canDeleteIndex && (
          <Button
            variant="secondary"
            onClick={onOpenDelete}
            disabled={isDeleting || isIndexing}
          >
            Delete Index
          </Button>
        )}
      </Box>
    </Box>
  );
});

RunIndexGeneralSection.displayName = 'RunIndexGeneralSection';

/** @type {MuiSx} */
const runIndexGeneralSectionStyles = () => ({
  generalGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  generalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  generalActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
});

export default RunIndexGeneralSection;
