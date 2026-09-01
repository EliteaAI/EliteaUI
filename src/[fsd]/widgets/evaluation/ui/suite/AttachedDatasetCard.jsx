import { memo, useCallback, useRef, useState } from 'react';

import { Box, Menu, MenuItem, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import LoopToolIcon from '@/assets/loop_tool.svg?react';
import ShareIcon from '@/assets/share-icon.svg?react';
import CloseIcon from '@/components/Icons/CloseIcon';
import DotsMenuIcon from '@/components/Icons/DotsMenuIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_PERMISSIONS } from '../../lib/constants';
import DatasetCasesList from './DatasetCasesList';

const AttachedDatasetCard = memo(props => {
  const {
    dataset,
    availableDatasets = [],
    onChangeDataset,
    onRemoveDataset,
    onCreateDataset,
    onOpenDataset,
    onAddCase,
    onEditCase,
    onDeleteCase,
  } = props;

  const { checkPermission } = useCheckPermission();
  const canUpdateSuite = checkPermission(EVAL_PERMISSIONS.suiteUpdate);
  const canCreateDataset = checkPermission(EVAL_PERMISSIONS.datasetCreate);
  const canUpdateDataset = checkPermission(EVAL_PERMISSIONS.datasetUpdate);

  const [overflowAnchor, setOverflowAnchor] = useState(null);
  const [selectorAnchor, setSelectorAnchor] = useState(null);
  const overflowAnchorRef = useRef(null);

  const handleOpenOverflow = useCallback(event => {
    event.stopPropagation();
    overflowAnchorRef.current = event.currentTarget;
    setOverflowAnchor(event.currentTarget);
  }, []);

  const handleCloseOverflow = useCallback(() => {
    setOverflowAnchor(null);
  }, []);

  const handleOpenSelector = useCallback(() => {
    const anchor = overflowAnchorRef.current;
    handleCloseOverflow();
    setSelectorAnchor(anchor);
  }, [handleCloseOverflow]);

  const handleCloseSelector = useCallback(() => {
    setSelectorAnchor(null);
  }, []);

  const handleSelectDataset = useCallback(
    selectedDataset => {
      handleCloseSelector();
      onChangeDataset?.(selectedDataset);
    },
    [handleCloseSelector, onChangeDataset],
  );

  const handleCreateDataset = useCallback(() => {
    handleCloseSelector();
    onCreateDataset?.();
  }, [handleCloseSelector, onCreateDataset]);

  const handleRemoveDataset = useCallback(() => {
    handleCloseOverflow();
    onRemoveDataset?.();
  }, [handleCloseOverflow, onRemoveDataset]);

  const handleNameClick = useCallback(() => {
    onOpenDataset?.(dataset);
  }, [onOpenDataset, dataset]);

  const canChangeDataset = availableDatasets.length > 0;
  const caseCount = dataset.case_count ?? 0;
  const cases = dataset.cases ?? [];

  const styles = attachedDatasetCardStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Box sx={styles.nameRow}>
          <Typography
            sx={styles.name}
            onClick={handleNameClick}
          >
            {dataset.name}
          </Typography>
          {dataset.is_shared && (
            <Box sx={styles.sharedBadge}>
              <ShareIcon style={styles.shareIcon} />
              <Typography sx={styles.sharedText}>Shared</Typography>
            </Box>
          )}
        </Box>
        {canUpdateSuite && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            onClick={handleOpenOverflow}
            sx={styles.overflowButton}
          >
            <DotsMenuIcon />
          </Button.BaseBtn>
        )}
      </Box>

      <Box sx={styles.content}>
        {caseCount === 0 ? (
          <>
            <Typography sx={styles.noCasesText}>No cases added yet.</Typography>
            {canUpdateDataset && (
              <Button.BaseBtn
                color={BUTTON_COLORS.secondary}
                startIcon={<PlusIcon />}
                onClick={onAddCase}
                sx={styles.addCaseButton}
              >
                Case
              </Button.BaseBtn>
            )}
          </>
        ) : (
          <DatasetCasesList
            cases={cases}
            caseCount={caseCount}
            onAddCase={onAddCase}
            onEditCase={onEditCase}
            onDeleteCase={onDeleteCase}
          />
        )}
      </Box>

      <Menu
        anchorEl={overflowAnchor}
        open={Boolean(overflowAnchor)}
        onClose={handleCloseOverflow}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: styles.overflowMenuPaper },
        }}
      >
        <MenuItem
          onClick={handleOpenSelector}
          disabled={!canChangeDataset}
          sx={styles.overflowMenuItem}
        >
          <LoopToolIcon style={styles.overflowMenuIcon} />
          <Typography sx={styles.overflowMenuText}>Change dataset</Typography>
        </MenuItem>
        <MenuItem
          onClick={handleRemoveDataset}
          sx={styles.overflowMenuItem}
        >
          <CloseIcon sx={styles.overflowMenuIconSx} />
          <Typography sx={styles.overflowMenuText}>Remove from suite</Typography>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={selectorAnchor}
        open={Boolean(selectorAnchor)}
        onClose={handleCloseSelector}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
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
        {availableDatasets.map(ds => (
          <MenuItem
            key={ds.id}
            onClick={() => handleSelectDataset(ds)}
            sx={styles.datasetMenuItem}
          >
            <Box sx={styles.datasetInfo}>
              <Typography sx={styles.datasetName}>{ds.name}</Typography>
              <Box sx={styles.datasetMetaRow}>
                <Typography sx={styles.datasetMeta}>{ds.case_count ?? 0} cases</Typography>
                {ds.is_shared && (
                  <>
                    <Typography sx={styles.datasetMeta}>|</Typography>
                    <ShareIcon style={styles.shareIcon} />
                    <Typography sx={styles.datasetMeta}>Shared</Typography>
                  </>
                )}
                {ds.description && (
                  <>
                    <Typography sx={styles.datasetMeta}>|</Typography>
                    <Typography sx={styles.datasetMetaDescription}>{ds.description}</Typography>
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

AttachedDatasetCard.displayName = 'AttachedDatasetCard';

/** @type {MuiSx} */
const attachedDatasetCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: '0.5rem',
    gap: '0.5rem',
    backgroundColor: palette.background.folder.default,
    borderRadius: '0.75rem',
  }),
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    gap: '0.5rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.folder.default,
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      padding: '0.0625rem',
      background: palette.background.folder.borderGradient,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
    },
  }),
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    minWidth: 0,
  },
  name: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 500,
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  sharedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  shareIcon: {
    width: '0.75rem',
    height: '0.75rem',
    flexShrink: 0,
  },
  sharedText: ({ palette }) => ({
    fontSize: '0.75rem',
    color: palette.text.primary,
  }),
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
  },
  noCasesText: ({ palette }) => ({
    fontFamily: 'Montserrat, sans-serif',
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
    color: palette.text.primary,
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
  }),
  addCaseButton: ({ palette }) => ({
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
  overflowButton: ({ palette }) => ({
    minWidth: 'unset',
    padding: '0.25rem',
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  overflowMenuPaper: ({ palette }) => ({
    minWidth: '10rem',
    backgroundColor: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    boxShadow: palette.boxShadow.default,
    '>ul': {
      padding: '0.25rem 0',
    },
  }),
  overflowMenuItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    backgroundColor: palette.background.secondary,
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  overflowMenuIcon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
  overflowMenuIconSx: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
  overflowMenuText: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
  selectorMenuPaper: ({ palette }) => ({
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
});

export default AttachedDatasetCard;
