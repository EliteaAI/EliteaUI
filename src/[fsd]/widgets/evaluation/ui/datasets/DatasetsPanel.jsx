import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/components/Icons/PlusIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_PERMISSIONS } from '../../lib/constants';
import DatasetList from './DatasetList';

const DatasetsPanel = memo(props => {
  const {
    datasets = [],
    selectedDatasetId,
    applicationId = null,
    onSelect,
    onCreate,
    onRename,
    onDelete,
  } = props;

  const { checkPermission } = useCheckPermission();
  const canCreate = checkPermission(EVAL_PERMISSIONS.datasetCreate);

  const styles = datasetsPanelStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Typography
          variant="labelMedium"
          sx={styles.headerTitle}
        >
          DATASETS
        </Typography>
        {canCreate && (
          <Tooltip
            title="Create dataset"
            placement="top"
          >
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              color={BUTTON_COLORS.secondary}
              onClick={onCreate}
              sx={styles.addButton}
              data-testid="create-dataset-button"
            >
              <PlusIcon />
            </Button.BaseBtn>
          </Tooltip>
        )}
      </Box>

      <DatasetList
        datasets={datasets}
        selectedDatasetId={selectedDatasetId}
        applicationId={applicationId}
        onSelect={onSelect}
        onRename={onRename}
        onDelete={onDelete}
      />
    </Box>
  );
});

DatasetsPanel.displayName = 'DatasetsPanel';

/** @type {MuiSx} */
const datasetsPanelStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '16.1875rem',
    minWidth: '16.1875rem',
    height: '100%',
    borderRight: `0.0625rem solid ${palette.border.lines}`,
    overflow: 'hidden',
  }),
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3.575rem',
    minHeight: '3.575rem',
    padding: '0.75rem 1rem 0.75rem 1.5625rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.secondary,
  }),
  headerTitle: ({ palette }) => ({
    color: palette.text.primary,
    fontWeight: 500,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  }),
  addButton: ({ palette }) => ({
    minWidth: '1.75rem',
    width: '1.75rem',
    height: '1.75rem',
    padding: 0,
    borderRadius: '50%',

    svg: {
      path: { fill: palette.text.secondary },
    },
  }),
});

export default DatasetsPanel;
