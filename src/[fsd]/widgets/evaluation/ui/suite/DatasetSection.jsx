import { memo, useCallback, useState } from 'react';

import { Box, Menu, MenuItem, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/components/Icons/PlusIcon';

const DatasetSection = memo(props => {
  const { datasets = [], attachedDatasets = [], onAttachDataset, onCreateDataset } = props;

  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleOpenMenu = useCallback(event => {
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleCreateDataset = useCallback(() => {
    handleCloseMenu();
    onCreateDataset?.();
  }, [handleCloseMenu, onCreateDataset]);

  const handleSelectDataset = useCallback(
    dataset => {
      handleCloseMenu();
      onAttachDataset?.(dataset);
    },
    [handleCloseMenu, onAttachDataset],
  );

  const availableDatasets = datasets.filter(d => !attachedDatasets.some(ad => ad.id === d.id));
  const hasAttachedDatasets = attachedDatasets.length > 0;

  const styles = datasetSectionStyles();

  return (
    <Box sx={styles.root}>
      {!hasAttachedDatasets && (
        <Typography
          variant="bodySmall"
          sx={styles.emptyText}
        >
          Choose dataset or create a new one to ...
        </Typography>
      )}

      <Button.BaseBtn
        variant={BUTTON_VARIANTS.outlined}
        color={BUTTON_COLORS.secondary}
        startIcon={<PlusIcon />}
        onClick={handleOpenMenu}
        sx={styles.addButton}
      >
        Dataset
      </Button.BaseBtn>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: { sx: styles.menuPaper },
        }}
      >
        <MenuItem
          onClick={handleCreateDataset}
          sx={styles.createMenuItem}
        >
          <PlusIcon sx={styles.menuPlusIcon} />
          <Typography sx={styles.createMenuText}>Create Dataset</Typography>
        </MenuItem>
        {availableDatasets.map(dataset => (
          <MenuItem
            key={dataset.id}
            onClick={() => handleSelectDataset(dataset)}
            sx={styles.datasetMenuItem}
          >
            <Box sx={styles.datasetInfo}>
              <Typography sx={styles.datasetName}>{dataset.name}</Typography>
              <Typography sx={styles.datasetMeta}>
                {dataset.case_count ?? 0} cases
                {dataset.description ? ` | ${dataset.description}` : ''}
              </Typography>
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
  menuPaper: ({ palette }) => ({
    width: '21.75rem',
    maxHeight: '20rem',
    marginLeft: '0.25rem',
    backgroundColor: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    boxShadow: palette.shadows?.menu,
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
      height: '1px',
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
  datasetName: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  datasetMeta: ({ palette }) => ({
    fontSize: '0.75rem',
    color: palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});

export default DatasetSection;
