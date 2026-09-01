import { memo, useCallback, useState } from 'react';

import { Box, Menu, MenuItem, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/components/Icons/PlusIcon';

const DimensionSection = memo(props => {
  const { dimensions = [], attachedDimensions = [], onAttachDimension, onCreateDimension } = props;

  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleOpenMenu = useCallback(event => {
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleCreateDimension = useCallback(() => {
    handleCloseMenu();
    onCreateDimension?.();
  }, [handleCloseMenu, onCreateDimension]);

  const handleSelectDimension = useCallback(
    dimension => {
      handleCloseMenu();
      onAttachDimension?.(dimension);
    },
    [handleCloseMenu, onAttachDimension],
  );

  const availableDimensions = dimensions.filter(d => !attachedDimensions.some(ad => ad.id === d.id));
  const hasAttachedDimensions = attachedDimensions.length > 0;

  const styles = dimensionSectionStyles();

  return (
    <Box sx={styles.root}>
      {!hasAttachedDimensions && (
        <Typography
          variant="bodySmall"
          sx={styles.emptyText}
        >
          No dimensions added yet.
        </Typography>
      )}

      <Button.BaseBtn
        color={BUTTON_COLORS.secondary}
        startIcon={<PlusIcon />}
        onClick={handleOpenMenu}
        sx={styles.addButton}
      >
        Dimension
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
          onClick={handleCreateDimension}
          sx={styles.createMenuItem}
        >
          <PlusIcon sx={styles.menuPlusIcon} />
          <Typography sx={styles.createMenuText}>Create Dimension</Typography>
        </MenuItem>
        {availableDimensions.map(dimension => (
          <MenuItem
            key={dimension.id}
            onClick={() => handleSelectDimension(dimension)}
            sx={styles.dimensionMenuItem}
          >
            <Box sx={styles.dimensionInfo}>
              <Typography sx={styles.dimensionName}>{dimension.name}</Typography>
              <Typography sx={styles.dimensionMeta}>{dimension.description || '[No Description]'}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
});

DimensionSection.displayName = 'DimensionSection';

/** @type {MuiSx} */
const dimensionSectionStyles = () => ({
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
    boxShadow: palette.boxShadow.default,
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
  dimensionMenuItem: ({ palette }) => ({
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
  dimensionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
    minHeight: '2.625rem',
    overflow: 'hidden',
  },
  dimensionName: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  dimensionMeta: ({ palette }) => ({
    fontSize: '0.75rem',
    color: palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});

export default DimensionSection;
