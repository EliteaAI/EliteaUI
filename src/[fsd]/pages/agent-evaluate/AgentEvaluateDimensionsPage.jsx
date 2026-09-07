import { memo, useCallback, useMemo, useState } from 'react';

import { useParams } from 'react-router-dom';

import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';

import { BreadcrumbsOrTitle, Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import {
  DimensionModal,
  ManageDimensionCard,
  parseEvalError,
  useDeleteEvalDimensionMutation,
  useEvalDimensionsQuery,
  usePlatformDimensionCatalogQuery,
} from '@/[fsd]/widgets/evaluation';
import { EVAL_PERMISSIONS, EVAL_TIER } from '@/[fsd]/widgets/evaluation/lib/constants';
import PlusIcon from '@/components/Icons/PlusIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const DIMENSION_TABS = {
  agent: EVAL_TIER.agent_adhoc,
  project: EVAL_TIER.project,
  platform: EVAL_TIER.platform,
};

const AgentEvaluateDimensionsPage = memo(() => {
  const { agentId } = useParams();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const { checkPermission } = useCheckPermission();

  const applicationId = useMemo(() => (agentId ? parseInt(agentId, 10) : null), [agentId]);

  const [activeTab, setActiveTab] = useState(DIMENSION_TABS.agent);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dimensionToEdit, setDimensionToEdit] = useState(null);
  const [dimensionToDelete, setDimensionToDelete] = useState(null);

  const skip = !projectId || !applicationId;

  const {
    data: agentProjectDimensions = [],
    isLoading: isLoadingDimensions,
    isError: isDimensionsError,
  } = useEvalDimensionsQuery({ projectId, agentId: applicationId, includePlatform: false }, { skip });
  const {
    data: platformDimensions = [],
    isLoading: isLoadingPlatform,
    isError: isPlatformError,
  } = usePlatformDimensionCatalogQuery({ projectId }, { skip });
  const isLoading = isLoadingDimensions || isLoadingPlatform;
  const isError = isDimensionsError || isPlatformError;

  const [deleteDimension, { isLoading: isDeleting }] = useDeleteEvalDimensionMutation();

  const canCreate = checkPermission(EVAL_PERMISSIONS.dimensionCreate);
  const canUpdate = checkPermission(EVAL_PERMISSIONS.dimensionUpdate);
  const canDelete = checkPermission(EVAL_PERMISSIONS.dimensionDelete);

  const filteredDimensions = useMemo(() => {
    const source = activeTab === EVAL_TIER.platform ? platformDimensions : agentProjectDimensions;
    const byTab = source.filter(d => d.tier === activeTab);
    const term = search.trim().toLowerCase();
    if (!term) return byTab;
    return byTab.filter(d => (d.name || '').toLowerCase().includes(term));
  }, [agentProjectDimensions, platformDimensions, activeTab, search]);

  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleSearchChange = useCallback(value => {
    setSearch(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearch('');
  }, []);

  const handleCreate = useCallback(() => {
    setDimensionToEdit(null);
    setShowCreateModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const handleDimensionCreated = useCallback(() => {
    toastSuccess('Dimension has been created successfully.');
  }, [toastSuccess]);

  const handleEdit = useCallback(dimension => {
    setDimensionToEdit(dimension);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setDimensionToEdit(null);
  }, []);

  const handleDimensionUpdated = useCallback(() => {
    toastSuccess('Dimension has been updated successfully.');
  }, [toastSuccess]);

  const handleDelete = useCallback(dimension => {
    setDimensionToDelete(dimension);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDimensionToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!dimensionToDelete) return;
    try {
      await deleteDimension({
        projectId,
        dimensionId: dimensionToDelete.id,
        agentId: dimensionToDelete.tier === EVAL_TIER.agent_adhoc ? applicationId : undefined,
      }).unwrap();
      toastSuccess(`Dimension "${dimensionToDelete.name}" has been deleted.`);
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete dimension.'));
    }
    setDimensionToDelete(null);
  }, [dimensionToDelete, deleteDimension, projectId, applicationId, toastSuccess, toastError]);

  const emptyMessage = search
    ? 'No dimensions match your search.\nTry a different search term.'
    : 'No dimensions created yet.\nCreate a dimension to define how agent performance should be evaluated.';

  const styles = agentEvaluateDimensionsPageStyles();

  if (isError) {
    return (
      <Box sx={styles.wrapper}>
        <Box sx={styles.header}>
          <BreadcrumbsOrTitle title="Manage Dimensions" />
        </Box>
        <Box sx={styles.body}>
          <Box sx={styles.centered}>
            <Typography
              variant="bodyMedium"
              sx={styles.errorText}
            >
              Failed to load dimensions. Please try refreshing the page.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <BreadcrumbsOrTitle title="Manage Dimensions" />
      </Box>
      <Box sx={styles.body}>
        <Box sx={styles.content}>
          <Box sx={styles.toolbar}>
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
            <Box sx={styles.toolbarActions}>
              <Input.SimpleSearchBar
                searchQuery={search}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                autoFocus={false}
                sx={styles.searchBar}
                data-testid="manage-dimensions-search"
              />
              {canCreate && (
                <Tooltip
                  title="Create dimension"
                  placement="top"
                >
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.contained}
                    color={BUTTON_COLORS.primary}
                    onClick={handleCreate}
                    disabled={activeTab === EVAL_TIER.platform}
                    sx={styles.addButton}
                    data-testid="create-dimension-button"
                  >
                    <PlusIcon />
                  </Button.BaseBtn>
                </Tooltip>
              )}
            </Box>
          </Box>

          {isLoading ? (
            <Box sx={styles.centered}>
              <CircularProgress size={24} />
            </Box>
          ) : filteredDimensions.length === 0 ? (
            <Box sx={styles.centered}>
              <Typography
                variant="bodyMedium"
                sx={styles.emptyText}
              >
                {emptyMessage}
              </Typography>
            </Box>
          ) : (
            <Box sx={styles.grid}>
              {filteredDimensions.map(dimension => (
                <ManageDimensionCard
                  key={dimension.id}
                  dimension={dimension}
                  canEdit={canUpdate && activeTab !== EVAL_TIER.platform}
                  canDelete={canDelete && activeTab !== EVAL_TIER.platform}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <DimensionModal
        open={showCreateModal || !!dimensionToEdit}
        onClose={dimensionToEdit ? handleCloseEdit : handleCloseCreateModal}
        projectId={projectId}
        applicationId={applicationId}
        dimension={dimensionToEdit}
        onSaved={dimensionToEdit ? handleDimensionUpdated : handleDimensionCreated}
      />

      <Modal.DeleteEntityModal
        open={!!dimensionToDelete}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Delete confirmation"
        textContent="Are you sure you want to delete the "
        name={dimensionToDelete?.name || ''}
        inlineExtraContent=" dimension? Enter the name to complete the action."
        shouldRequestInputName
        confirmButtonText="Delete"
        confirming={isDeleting}
        alarm
      />
    </Box>
  );
});

AgentEvaluateDimensionsPage.displayName = 'AgentEvaluateDimensionsPage';

/** @type {MuiSx} */
const agentEvaluateDimensionsPageStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: ({ palette }) => ({
    height: '3.8rem',
    minHeight: '3.8rem',
    width: '100%',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1.5rem',
  }),
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '1.5rem',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexShrink: 0,
  },
  tabs: {
    minHeight: 'unset',
    '& .MuiTabs-indicator': {
      height: '0.125rem',
    },
  },
  toolbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
  },
  searchBar: ({ palette }) => ({
    maxWidth: '14rem',
    flexShrink: 0,
    color: palette.text.secondary,
    '& svg': {
      color: palette.text.primary,
    },
  }),
  addButton: ({ palette }) => ({
    minWidth: '1.75rem',
    width: '1.75rem',
    height: '1.75rem',
    padding: '0.375rem',
    borderRadius: '50%',
    svg: {
      fill: palette.text.button.primary,
    },
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    alignContent: 'start',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '2rem',
  },
  emptyText: ({ palette }) => ({
    color: palette.text.primary,
    textAlign: 'center',
    whiteSpace: 'pre-line',
  }),
  errorText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default AgentEvaluateDimensionsPage;
