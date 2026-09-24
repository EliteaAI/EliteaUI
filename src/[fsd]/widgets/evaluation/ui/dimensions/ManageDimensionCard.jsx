import { memo, useCallback, useState } from 'react';

import { Box, Menu, MenuItem, Tooltip, Typography } from '@mui/material';

import { useTextOverflow } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DotsMenuIcon from '@/components/Icons/DotsMenuIcon';
import EditIcon from '@/components/Icons/EditIcon';

import { DIMENSION_BADGE_TOOLTIP, DIMENSION_BADGE_TOOLTIP_DELAY } from '../../lib/constants';
import { getEngineLabel, getEngineTooltip, getTargetLabel, getWeightLabel } from '../../lib/helpers';

const ManageDimensionCard = memo(props => {
  const { dimension, canEdit = false, canDelete = false, onEdit, onDelete } = props;

  const [menuAnchor, setMenuAnchor] = useState(null);
  const isMenuOpen = Boolean(menuAnchor);

  const engines = dimension.allowed_engines ?? [];
  const targetLabel = getTargetLabel(
    dimension.default_target,
    dimension.default_target_operator,
    dimension.scale_type,
  );
  const weightLabel = getWeightLabel(dimension.default_weight);
  const description = dimension.description || '';
  const { textRef: nameRef, isOverflowing: isNameTruncated } = useTextOverflow(dimension.name);
  const showNameTooltip = (dimension.name || '').length >= 30 || isNameTruncated;
  const badges = [
    ...engines.map(engine => ({
      key: engine,
      label: getEngineLabel(engine),
      tooltip: getEngineTooltip(engine),
    })),
    { key: 'target', label: targetLabel, tooltip: DIMENSION_BADGE_TOOLTIP.target },
    { key: 'weight', label: weightLabel, tooltip: DIMENSION_BADGE_TOOLTIP.weight },
  ].filter(badge => badge.label);

  const handleOpenMenu = useCallback(event => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleEdit = useCallback(() => {
    handleCloseMenu();
    onEdit?.(dimension);
  }, [dimension, onEdit, handleCloseMenu]);

  const handleDelete = useCallback(() => {
    handleCloseMenu();
    onDelete?.(dimension);
  }, [dimension, onDelete, handleCloseMenu]);

  const showMenu = canEdit || canDelete;

  const styles = manageDimensionCardStyles();

  return (
    <>
      <Box
        sx={styles.root}
        data-testid={`manage-dimension-card-${dimension.id}`}
      >
        <Box sx={styles.header}>
          <Box sx={styles.nameRow}>
            <Tooltip
              title={dimension.name}
              placement="top"
              disableHoverListener={!showNameTooltip}
            >
              <Typography
                ref={nameRef}
                variant="bodyMedium"
                sx={styles.name}
              >
                {dimension.name}
              </Typography>
            </Tooltip>
            <Box sx={styles.badges}>
              {badges.map(({ key, label, tooltip }) => (
                <Tooltip
                  key={key}
                  title={tooltip}
                  placement="top"
                  enterDelay={DIMENSION_BADGE_TOOLTIP_DELAY}
                  enterNextDelay={DIMENSION_BADGE_TOOLTIP_DELAY}
                >
                  <Typography
                    component="span"
                    variant="labelSmall"
                    sx={styles.badge}
                  >
                    {label}
                  </Typography>
                </Tooltip>
              ))}
            </Box>
          </Box>
          {showMenu && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              onClick={handleOpenMenu}
              startIcon={<DotsMenuIcon />}
              sx={styles.menuButton}
              data-testid={`manage-dimension-menu-${dimension.id}`}
            />
          )}
        </Box>
        {description && (
          <Typography
            variant="bodySmall"
            sx={styles.description}
          >
            {description}
          </Typography>
        )}
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={isMenuOpen}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: styles.menuPaper },
        }}
      >
        {canEdit && (
          <MenuItem
            onClick={handleEdit}
            sx={styles.menuItem}
            data-testid="manage-dimension-menu-edit"
          >
            <Box sx={styles.menuItemIcon}>
              <EditIcon />
            </Box>
            Edit
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            onClick={handleDelete}
            sx={styles.menuItem}
            data-testid="manage-dimension-menu-delete"
          >
            <Box sx={styles.menuItemIcon}>
              <DeleteIcon />
            </Box>
            Delete
          </MenuItem>
        )}
      </Menu>
    </>
  );
});

ManageDimensionCard.displayName = 'ManageDimensionCard';

/** @type {MuiSx} */
const manageDimensionCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.default}`,
    backgroundColor: palette.components.aiProviderAccordion.background.default,
    '&:hover': {
      backgroundColor: palette.components.aiProviderAccordion.background.hover,
      borderColor: palette.border.lines,
    },
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    minWidth: 0,
    flex: 1,
    overflow: 'hidden',
  },
  name: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
    minWidth: 0,
  }),
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
    cursor: 'default',
  },
  badge: ({ palette }) => ({
    padding: '0.25rem 0.5rem',
    borderRadius: '1.0625rem',
    color: palette.text.primary,
    backgroundColor: 'transparent',
    border: `0.0625rem solid ${palette.background.surface.interactive.default}`,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
  }),
  description: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.8125rem',
    lineHeight: '1.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  }),
  menuButton: {
    padding: '0.25rem',
    minWidth: 'auto',
    flexShrink: 0,
  },
  menuPaper: ({ palette }) => ({
    minWidth: '7.1875rem',
    backgroundColor: palette.background.default.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    '& .MuiList-root': {
      padding: '0.25rem 0',
    },
  }),
  menuItem: ({ palette }) => ({
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
    color: palette.text.secondary,
    gap: '0.5rem',
    '&:hover': {
      backgroundColor: palette.background.surface.interactive.default,
    },
  }),
  menuItemIcon: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
    '& svg path': {
      fill: palette.icon.default,
    },
  }),
});

export default ManageDimensionCard;
