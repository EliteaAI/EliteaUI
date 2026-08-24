import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import DatasetListRow from './DatasetListRow';
import NewDatasetMenu from './NewDatasetMenu';

const DatasetList = memo(props => {
  const {
    datasets = [],
    applicationId = null,
    canCreate = false,
    canEdit = false,
    canDelete = false,
    onOpen,
    onRename,
    onDelete,
    onNewSelect,
  } = props;

  const styles = datasetListStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-datasets-view"
    >
      <Box sx={styles.header}>
        <Box sx={styles.heading}>
          <Typography variant="headingSmall">Datasets</Typography>
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            Reusable sets of test cases for evaluation runs.
          </Typography>
        </Box>
        {canCreate && <NewDatasetMenu onSelect={onNewSelect} />}
      </Box>

      {datasets.length === 0 ? (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          No datasets yet.
        </Typography>
      ) : (
        <Box sx={styles.list}>
          {datasets.map(dataset => (
            <DatasetListRow
              key={dataset.id}
              dataset={dataset}
              applicationId={applicationId}
              canEdit={canEdit}
              canDelete={canDelete}
              onOpen={onOpen}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

DatasetList.displayName = 'DatasetList';

/** @type {MuiSx} */
const datasetListStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    height: '100%',
    overflowY: 'auto',
    padding: '1.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
});

export default DatasetList;
