import { memo, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { sortDatasetsByDate } from '../../lib/helpers/dataset.helpers';
import DatasetItem from './DatasetItem';

const DatasetList = memo(props => {
  const { datasets = [], selectedDatasetId, applicationId = null, onSelect, onRename, onDelete } = props;

  const [hoveredDatasetId, setHoveredDatasetId] = useState(null);

  const sortedDatasets = useMemo(() => sortDatasetsByDate(datasets), [datasets]);

  const styles = datasetListStyles();

  if (datasets.length === 0) {
    return (
      <Box sx={styles.root}>
        <Box sx={styles.emptyState}>
          <Typography
            variant="bodyMedium"
            sx={styles.emptyTitle}
          >
            No datasets created yet.
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.emptyText}
          >
            Create a dataset to start adding evaluation cases.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      {sortedDatasets.map((dataset, index) => {
        const nextDataset = sortedDatasets[index + 1];

        return (
          <DatasetItem
            key={dataset.id}
            dataset={dataset}
            selectedDatasetId={selectedDatasetId}
            hoveredDatasetId={hoveredDatasetId}
            applicationId={applicationId}
            isNextSelected={nextDataset?.id === selectedDatasetId}
            isNextHovered={nextDataset?.id === hoveredDatasetId}
            isLast={index === sortedDatasets.length - 1}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
            onMouseEnter={() => setHoveredDatasetId(dataset.id)}
            onMouseLeave={() => setHoveredDatasetId(null)}
          />
        );
      })}
    </Box>
  );
});

DatasetList.displayName = 'DatasetList';

/** @type {MuiSx} */
const datasetListStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    gap: '0.125rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
  },
  emptyTitle: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: '0.25rem',
  }),
  emptyText: ({ palette }) => ({
    color: palette.text.primary,
  }),
});

export default DatasetList;
