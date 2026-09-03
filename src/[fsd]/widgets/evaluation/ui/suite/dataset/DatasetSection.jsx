import { memo, useCallback, useState } from 'react';

import { Box, Menu, MenuItem, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ShareIcon from '@/assets/share-icon.svg?react';
import PlusIcon from '@/components/Icons/PlusIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_PERMISSIONS } from '../../../lib/constants';
import AttachedDatasetCard from './AttachedDatasetCard';

const DatasetSection = memo(props => {
  const {
    datasets = [],
    attachedDataset = null,
    onAttachDataset,
    onRemoveDataset,
    onCreateDataset,
    onOpenDataset,
    onAddCase,
    onEditCase,
    onRemoveCase,
    onImportCases,
    onPromoteCases,
  } = props;

  const { checkPermission } = useCheckPermission();
  const canUpdateSuite = checkPermission(EVAL_PERMISSIONS.suiteUpdate);
  const canCreateDataset = checkPermission(EVAL_PERMISSIONS.datasetCreate);

  const [selectorAnchor, setSelectorAnchor] = useState(null);

  const handleOpenSelector = useCallback(event => {
    setSelectorAnchor(event.currentTarget);
  }, []);

  const handleCloseSelector = useCallback(() => {
    setSelectorAnchor(null);
  }, []);

  const handleCreateDataset = useCallback(() => {
    handleCloseSelector();
    onCreateDataset?.();
  }, [handleCloseSelector, onCreateDataset]);

  const handleSelectDataset = useCallback(
    dataset => {
      handleCloseSelector();
      onAttachDataset?.(dataset);
    },
    [handleCloseSelector, onAttachDataset],
  );

  const availableDatasets = attachedDataset ? datasets.filter(d => d.id !== attachedDataset.id) : datasets;
  const hasAttachedDataset = !!attachedDataset;

  const styles = datasetSectionStyles();

  return (
    <Box sx={styles.root}>
      {hasAttachedDataset ? (
        <AttachedDatasetCard
          dataset={attachedDataset}
          availableDatasets={availableDatasets}
          onChangeDataset={onAttachDataset}
          onRemoveDataset={onRemoveDataset}
          onCreateDataset={onCreateDataset}
          onOpenDataset={onOpenDataset}
          onAddCase={onAddCase}
          onEditCase={onEditCase}
          onRemoveCase={onRemoveCase}
          onImportCases={onImportCases}
          onPromoteCases={onPromoteCases}
        />
      ) : (
        canUpdateSuite && (
          <>
            <Typography
              variant="bodySmall"
              sx={styles.emptyText}
            >
              Choose dataset or create a new one to ...
            </Typography>
            <Button.BaseBtn
              color={BUTTON_COLORS.secondary}
              startIcon={<PlusIcon />}
              onClick={handleOpenSelector}
              sx={styles.addButton}
            >
              Dataset
            </Button.BaseBtn>
          </>
        )
      )}

      <Menu
        anchorEl={selectorAnchor}
        open={Boolean(selectorAnchor)}
        onClose={handleCloseSelector}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: { sx: styles.selectorMenuPaper },
        }}
      >
        {canCreateDataset && (
          <MenuItem
            onClick={handleCreateDataset}
            sx={styles.createMenuItem}
          >
            <PlusIcon sx={styles.menuPlusIcon} />
            <Typography sx={styles.createMenuText}>Create Dataset</Typography>
          </MenuItem>
        )}
        {availableDatasets.map(dataset => (
          <MenuItem
            key={dataset.id}
            onClick={() => handleSelectDataset(dataset)}
            sx={styles.datasetMenuItem}
          >
            <Box sx={styles.datasetInfo}>
              <Box sx={styles.datasetNameRow}>
                <Typography sx={styles.datasetName}>{dataset.name}</Typography>
                {dataset.is_shared && (
                  <Tooltip
                    title="Shared across the project"
                    enterDelay={2000}
                    placement="top"
                  >
                    <Box
                      component="span"
                      sx={styles.shareIconWrapper}
                    >
                      <ShareIcon style={styles.shareIcon} />
                    </Box>
                  </Tooltip>
                )}
              </Box>
              <Box sx={styles.datasetMetaRow}>
                <Typography sx={styles.datasetMeta}>{dataset.case_count ?? 0} cases</Typography>
                {dataset.description && (
                  <>
                    <Typography sx={styles.datasetMeta}>|</Typography>
                    <Typography sx={styles.datasetMetaDescription}>{dataset.description}</Typography>
                  </>
                )}
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
});

DatasetSection.displayName = 'DatasetSection';

/** @type {MuiSx} */
const datasetSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  emptyText: ({ palette }) => ({
    marginTop: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    fontWeight: 400,
    color: palette.text.primary,
  }),
  addButton: ({ palette }) => ({
    alignSelf: 'flex-start',
    padding: '0.375rem 0.75rem',
    borderRadius: '1.25rem',
    borderColor: palette.border.lines,
    color: palette.text.secondary,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 500,
    '& .MuiButton-startIcon svg': {
      width: '0.75rem',
      height: '0.75rem',
    },
    '& svg path': {
      fill: palette.text.secondary,
    },
    '&:hover': {
      borderColor: palette.border.lines,
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  selectorMenuPaper: ({ palette }) => ({
    width: '21.75rem',
    maxHeight: '20rem',
    marginLeft: '0.25rem',
    backgroundColor: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    '>ul': {
      padding: '.25rem 0',
    },
  }),
  createMenuItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    gap: '0.75rem',
    height: '2.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: palette.action.hover,
    marginBottom: '.25rem',
    color: palette.text.secondary,
    svg: {
      path: { fill: palette.text.secondary },
    },
    ':after': {
      content: "''",
      position: 'absolute',
      height: '0.0625rem',
      width: '100%',
      backgroundColor: palette.border.lines,
      bottom: '-.25rem',
      left: 0,
    },
    '&:hover': {
      backgroundColor: palette.action.selected,
    },
  }),
  createMenuText: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  menuPlusIcon: {
    fontSize: '1rem',
  },
  datasetMenuItem: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minHeight: '3.625rem',
    padding: '0.5rem 1.25rem',
    gap: '0.25rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    '&:last-child': {
      borderBottom: 'none',
    },
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  datasetInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
    minHeight: '2.625rem',
    overflow: 'hidden',
  },
  datasetNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    minWidth: 0,
  },
  datasetName: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  shareIconWrapper: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '50%',
    border: `0.0625rem solid ${palette.border.lines}`,
    cursor: 'default',
  }),
  datasetMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  datasetMeta: ({ palette }) => ({
    fontSize: '0.75rem',
    color: palette.text.primary,
    flexShrink: 0,
  }),
  datasetMetaDescription: ({ palette }) => ({
    fontSize: '0.75rem',
    color: palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  shareIcon: {
    width: '0.625rem',
    height: '0.625rem',
  },
});

export default DatasetSection;
