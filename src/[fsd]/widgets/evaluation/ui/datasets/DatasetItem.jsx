import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Box, Menu, MenuItem, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DotsMenuIcon from '@/components/Icons/DotsMenuIcon';
import EditIcon from '@/components/Icons/EditIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_PERMISSIONS } from '../../lib/constants';
import { isDatasetSharedIn } from '../../lib/helpers';
import { SharedDatasetBadge } from '../common';

const DatasetItem = memo(props => {
  const {
    dataset,
    selectedDatasetId,
    hoveredDatasetId,
    applicationId,
    isNextSelected,
    isNextHovered,
    isLast,
    onSelect,
    onRename,
    onDelete,
    onMouseEnter,
    onMouseLeave,
  } = props;

  const { checkPermission } = useCheckPermission();
  const canEdit = checkPermission(EVAL_PERMISSIONS.datasetUpdate);
  const canDelete = checkPermission(EVAL_PERMISSIONS.datasetDelete);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const nameRef = useRef(null);
  const metaRef = useRef(null);

  const isSelected = dataset.id === selectedDatasetId;
  const isHovered = dataset.id === hoveredDatasetId;
  const isMenuOpen = Boolean(menuAnchor);
  const caseCount = dataset.case_count ?? dataset.cases?.length ?? 0;
  const datasetIsSharedIn = isDatasetSharedIn(dataset, applicationId);
  const showMenu = (canEdit || canDelete) && !datasetIsSharedIn;
  const showSeparator = !isLast && !isSelected && !isHovered && !isNextSelected && !isNextHovered;

  const handleOpenMenu = useCallback(event => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleRename = useCallback(() => {
    handleCloseMenu();
    onRename?.(dataset);
  }, [dataset, onRename, handleCloseMenu]);

  const handleDelete = useCallback(() => {
    handleCloseMenu();
    onDelete?.(dataset);
  }, [dataset, onDelete, handleCloseMenu]);

  const showMenuButton = showMenu && (isHovered || isMenuOpen);
  const styles = datasetItemStyles();

  const checkTruncation = useCallback(() => {
    const nameTruncated = nameRef.current ? nameRef.current.scrollWidth > nameRef.current.clientWidth : false;
    const metaTruncated = metaRef.current ? metaRef.current.scrollWidth > metaRef.current.clientWidth : false;
    setIsTruncated(nameTruncated || metaTruncated);
  }, []);

  useLayoutEffect(() => {
    checkTruncation();
  }, [checkTruncation, dataset.name, dataset.description, caseCount]);

  useEffect(() => {
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [checkTruncation]);

  const tooltipContent = useMemo(() => {
    const descriptionText = dataset.description || '';

    return (
      <Box sx={styles.tooltipContent}>
        <Box
          component="span"
          sx={styles.tooltipNameRow}
        >
          <Typography
            component="span"
            sx={styles.tooltipName}
          >
            {dataset.name}
          </Typography>
          {dataset.is_shared && (
            <Typography
              component="span"
              sx={styles.tooltipSharedText}
            >
              {' '}
              (Shared across the project)
            </Typography>
          )}
        </Box>
        {descriptionText && <Typography sx={styles.tooltipDescription}>{descriptionText}</Typography>}
      </Box>
    );
  }, [dataset.name, dataset.description, dataset.is_shared, styles]);

  const itemContent = (
    <Box
      sx={styles.root(isSelected, showSeparator)}
      onClick={() => onSelect?.(dataset)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid={`dataset-item-${dataset.id}`}
    >
      <Box sx={styles.content}>
        <Box sx={styles.nameRow}>
          <Typography
            ref={nameRef}
            variant="bodyMedium"
            sx={styles.name}
          >
            {dataset.name}
          </Typography>
          {dataset.is_shared && <SharedDatasetBadge showTooltip={false} />}
        </Box>
        <Typography
          ref={metaRef}
          variant="bodySmall"
          sx={styles.meta}
        >
          {caseCount} case{caseCount === 1 ? '' : 's'}
          {dataset.description ? ` | ${dataset.description}` : ''}
        </Typography>
      </Box>
      {showMenuButton && (
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          onClick={handleOpenMenu}
          startIcon={<DotsMenuIcon />}
          sx={styles.menuButton}
          data-testid={`dataset-menu-${dataset.id}`}
        />
      )}
    </Box>
  );

  return (
    <>
      {isTruncated ? (
        <Tooltip
          title={tooltipContent}
          placement="right"
          enterDelay={2000}
          slotProps={{
            tooltip: { sx: styles.tooltip },
          }}
        >
          {itemContent}
        </Tooltip>
      ) : (
        itemContent
      )}

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
        {canEdit && !datasetIsSharedIn && (
          <MenuItem
            onClick={handleRename}
            sx={styles.menuItem}
            data-testid="dataset-menu-rename"
          >
            <Box sx={styles.menuItemIcon}>
              <EditIcon />
            </Box>
            Edit
          </MenuItem>
        )}
        {canDelete && !datasetIsSharedIn && (
          <MenuItem
            onClick={handleDelete}
            sx={styles.menuItem}
            data-testid="dataset-menu-delete"
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

DatasetItem.displayName = 'DatasetItem';

/** @type {MuiSx} */
const datasetItemStyles = () => ({
  root:
    (isSelected, showSeparator) =>
    ({ palette }) => ({
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      backgroundColor: isSelected ? palette.background.participant.active : 'transparent',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: isSelected
          ? palette.background.participant.active
          : palette.background.participant.default,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '0.0625rem',
        width: '100%',
        backgroundColor: showSeparator ? palette.border.table : 'transparent',
      },
    }),
  content: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    overflow: 'hidden',
  },
  name: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  meta: ({ palette }) => ({
    display: 'block',
    color: palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '0.125rem',
  }),
  menuButton: {
    padding: '0.25rem',
    minWidth: 'auto',
    flexShrink: 0,
  },
  tooltip: ({ palette }) => ({
    maxWidth: '18.1875rem',
    backgroundColor: palette.text.tooltip.default,
    borderRadius: '0.25rem',
    padding: '0.25rem 0.5rem',
  }),
  tooltipContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  tooltipNameRow: {
    display: 'block',
  },
  tooltipName: ({ palette }) => ({
    color: palette.text.tooltip,
    fontWeight: 700,
    fontSize: '0.75rem',
    lineHeight: '1rem',
  }),
  tooltipSharedText: ({ palette }) => ({
    color: palette.text.tooltip,
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: '1rem',
  }),
  tooltipDescription: ({ palette }) => ({
    color: palette.text.tooltip,
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: '1rem',
  }),
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
      backgroundColor: palette.background.participant.default,
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
      fill: palette.icon.fill.default,
    },
  }),
});

export default DatasetItem;
