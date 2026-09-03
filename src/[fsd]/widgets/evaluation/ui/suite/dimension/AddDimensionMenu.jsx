import { memo, useCallback, useState } from 'react';

import { Box, Menu, MenuItem, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS } from '@/[fsd]/shared/ui/button/BaseBtn';
import SparkleIcon from '@/assets/ai-sparkle-icon.svg?react';
import BookIcon from '@/assets/book.svg?react';
import EditPenIcon from '@/components/Icons/EditPenIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_PERMISSIONS } from '../../../lib/constants';

const ADD_DIMENSION_MENU = {
  selectFromLibrary: 'selectFromLibrary',
  createManually: 'createManually',
  buildWithAi: 'buildWithAi',
};

const DEFAULT_ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'right' };
const DEFAULT_TRANSFORM_ORIGIN = { vertical: 'bottom', horizontal: 'left' };

const AddDimensionMenu = memo(props => {
  const {
    onSelectFromLibrary,
    onCreateManually,
    onBuildWithAi,
    disabled = false,
    anchorOrigin = DEFAULT_ANCHOR_ORIGIN,
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
  } = props;

  const { checkPermission } = useCheckPermission();
  const canCreateDimension = checkPermission(EVAL_PERMISSIONS.dimensionCreate);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMenuItemClick = useCallback(
    menuItem => {
      handleCloseMenu();
      switch (menuItem) {
        case ADD_DIMENSION_MENU.selectFromLibrary:
          onSelectFromLibrary?.();
          break;
        case ADD_DIMENSION_MENU.createManually:
          onCreateManually?.();
          break;
        case ADD_DIMENSION_MENU.buildWithAi:
          onBuildWithAi?.();
          break;
        default:
          break;
      }
    },
    [handleCloseMenu, onSelectFromLibrary, onCreateManually, onBuildWithAi],
  );

  const styles = addDimensionMenuStyles();

  return (
    <>
      <Button.BaseBtn
        color={BUTTON_COLORS.secondary}
        startIcon={<PlusIcon />}
        onClick={handleOpenMenu}
        disabled={disabled}
        sx={styles.addDimensionButton}
        data-testid="add-dimension-button"
      >
        Dimension
      </Button.BaseBtn>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        slotProps={{
          paper: { sx: styles.menuPaper },
        }}
      >
        <MenuItem
          onClick={() => handleMenuItemClick(ADD_DIMENSION_MENU.selectFromLibrary)}
          sx={styles.menuItem}
          data-testid="add-dimension-from-library"
        >
          <Box
            component="span"
            sx={styles.svgIcon}
          >
            <BookIcon />
          </Box>
          <Typography sx={styles.menuText}>Select from library</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuItemClick(ADD_DIMENSION_MENU.createManually)}
          disabled={!canCreateDimension}
          sx={styles.menuItem}
          data-testid="add-dimension-create-manually"
        >
          <EditPenIcon sx={styles.menuIcon} />
          <Typography sx={styles.menuText}>Create manually</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuItemClick(ADD_DIMENSION_MENU.buildWithAi)}
          disabled={!canCreateDimension}
          sx={styles.menuItem}
          data-testid="add-dimension-build-with-ai"
        >
          <Box
            component="span"
            sx={styles.svgIcon}
          >
            <SparkleIcon />
          </Box>
          <Typography sx={styles.menuText}>Build with AI</Typography>
        </MenuItem>
      </Menu>
    </>
  );
});

AddDimensionMenu.displayName = 'AddDimensionMenu';

/** @type {MuiSx} */
const addDimensionMenuStyles = () => ({
  addDimensionButton: ({ palette }) => ({
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
    minWidth: '12rem',
    backgroundColor: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    marginTop: '0.25rem',
    marginLeft: '.25rem',

    '>ul': {
      padding: '0.25rem 0',
    },
  }),
  menuItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    backgroundColor: palette.background.secondary,
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  menuIcon: ({ palette }) => ({
    fontSize: '1rem',
    flexShrink: 0,
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
  svgIcon: ({ palette }) => ({
    display: 'inline-flex',
    flexShrink: 0,
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
  menuText: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
});

export default AddDimensionMenu;
