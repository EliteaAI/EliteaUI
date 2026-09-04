import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';

import { useEvalDimensionsQuery, usePlatformDimensionCatalogQuery } from '../../../api';
import { EVAL_TIER } from '../../../lib/constants';
import DimensionItem from './DimensionItem';

const DIMENSION_TABS = {
  agent: EVAL_TIER.agent_adhoc,
  project: EVAL_TIER.project,
  platform: EVAL_TIER.platform,
};

const SelectDimensionFromLibraryModal = memo(props => {
  const { open, onClose, projectId, applicationId = null, attachedDimensionIds = [], onAdd } = props;

  const [activeTab, setActiveTab] = useState(DIMENSION_TABS.agent);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: agentProjectDimensions = [], isFetching: isFetchingDimensions } = useEvalDimensionsQuery(
    { projectId, agentId: applicationId, includePlatform: false },
    { skip: !open || !projectId },
  );
  const { data: platformDimensions = [], isFetching: isFetchingPlatform } = usePlatformDimensionCatalogQuery(
    { projectId },
    { skip: !open || !projectId },
  );
  const isFetching = isFetchingDimensions || isFetchingPlatform;

  useEffect(() => {
    if (open) {
      setActiveTab(DIMENSION_TABS.agent);
      setSearch('');
      setSelectedIds([]);
    }
  }, [open]);

  const attachedSet = useMemo(() => new Set(attachedDimensionIds), [attachedDimensionIds]);

  const availableDimensions = useMemo(() => {
    const source = activeTab === EVAL_TIER.platform ? platformDimensions : agentProjectDimensions;
    const filtered = source.filter(d => d.tier === activeTab && !attachedSet.has(d.id));

    const term = search.trim().toLowerCase();
    if (!term) return filtered;

    return filtered.filter(d => {
      const name = (d.name || '').toLowerCase();
      const desc = (d.description || '').toLowerCase();
      return name.includes(term) || desc.includes(term);
    });
  }, [agentProjectDimensions, platformDimensions, attachedSet, search, activeTab]);

  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
    setSelectedIds([]);
  }, []);

  const handleSearchChange = useCallback(value => {
    setSearch(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearch('');
  }, []);

  const handleToggleRow = useCallback(id => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  }, []);

  const handleAdd = useCallback(() => {
    if (selectedIds.length === 0) return;
    const source = activeTab === EVAL_TIER.platform ? platformDimensions : agentProjectDimensions;
    const selected = source.filter(d => selectedIds.includes(d.id));
    onAdd?.(selected);
    onClose();
  }, [selectedIds, activeTab, agentProjectDimensions, platformDimensions, onAdd, onClose]);

  const selectedCount = selectedIds.length;

  const styles = selectDimensionModalStyles();

  const content = (
    <Box sx={styles.content}>
      <Box sx={styles.header}>
        <BaseTabs
          value={activeTab}
          onChange={handleTabChange}
          sx={styles.tabs}
        >
          <BaseTab
            value={DIMENSION_TABS.agent}
            label="Agent"
          />
          <BaseTab
            value={DIMENSION_TABS.project}
            label="Project"
          />
          <BaseTab
            value={DIMENSION_TABS.platform}
            label="Platform"
          />
        </BaseTabs>
        <Input.SimpleSearchBar
          searchQuery={search}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
          autoFocus={false}
          sx={styles.searchBar}
          data-testid="select-dimension-search"
        />
      </Box>

      <Box
        sx={styles.list}
        data-testid="select-dimension-list"
      >
        {isFetching ? (
          <Box sx={styles.centered}>
            <CircularProgress size={20} />
          </Box>
        ) : availableDimensions.length === 0 ? (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={styles.emptyText}
          >
            {search ? 'No dimensions match your search.' : 'No dimensions available to add.'}
          </Typography>
        ) : (
          availableDimensions.map(dimension => (
            <DimensionItem
              key={dimension.id}
              dimension={dimension}
              isSelected={selectedIds.includes(dimension.id)}
              onClick={() => handleToggleRow(dimension.id)}
            />
          ))
        )}
      </Box>
    </Box>
  );

  const footer = (
    <Box sx={styles.footer}>
      <Typography
        variant="bodySmall"
        sx={styles.selectedCount}
      >
        {selectedCount} selected
      </Typography>
      <Box sx={styles.actionButtons}>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.secondary}
          onClick={onClose}
        >
          Cancel
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          disabled={selectedCount === 0}
          onClick={handleAdd}
          data-testid="select-dimension-submit"
        >
          Add
        </Button.BaseBtn>
      </Box>
    </Box>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Add Dimension"
      onClose={onClose}
      content={content}
      footer={footer}
      sx={styles.dialogPaper}
      dialogSx={styles.dialog}
      data-testid="select-dimension-from-library-modal"
    />
  );
});

SelectDimensionFromLibraryModal.displayName = 'SelectDimensionFromLibraryModal';

/** @type {MuiSx} */
const selectDimensionModalStyles = () => ({
  dialogPaper: {
    width: '50rem',
  },
  dialog: {
    minHeight: '32rem',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexShrink: 0,
    paddingBottom: '1rem',
  },
  tabs: {
    minHeight: 'unset',
    '& .MuiTabs-indicator': {
      height: '0.125rem',
    },
  },
  searchBar: ({ palette }) => ({
    maxWidth: '14rem',
    flexShrink: 0,
    color: palette.text.secondary,
    '& svg': {
      color: palette.text.primary,
    },
  }),
  list: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    marginLeft: '-1.5rem',
    marginRight: '-1.5rem',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    flex: 1,
  },
  emptyText: ({ palette }) => ({
    padding: '2rem',
    textAlign: 'center',
    color: palette.text.primary,
  }),
  footer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    padding: '0.75rem 1.5rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  selectedCount: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.875rem',
  }),
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default SelectDimensionFromLibraryModal;
