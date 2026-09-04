import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_PERMISSIONS, EVAL_TIER } from '../../../lib/constants';
import AddDimensionMenu from './AddDimensionMenu';
import DimensionCard from './DimensionCard';

const DimensionSection = memo(props => {
  const { attachedDimensions = [], dimensionActions = {} } = props;

  const {
    handleSelectDimensionFromLibrary: onSelectFromLibrary,
    handleCreateDimensionManually: onCreateManually,
    handleBuildDimensionWithAi: onBuildWithAi,
    handleEditDimension: onEditDimension,
    handleRemoveDimension: onRemoveDimension,
  } = dimensionActions;

  const { checkPermission } = useCheckPermission();
  const canUpdateSuite = checkPermission(EVAL_PERMISSIONS.suiteUpdate);
  const canUpdateDimension = checkPermission(EVAL_PERMISSIONS.dimensionUpdate);

  const hasAttachedDimensions = attachedDimensions.length > 0;

  const styles = dimensionSectionStyles();

  return (
    <Box sx={styles.root}>
      {hasAttachedDimensions ? (
        <Box sx={styles.cardList}>
          {attachedDimensions.map(item => {
            // Only agent-level dimensions can be edited from Suite view
            // Shared dimensions (project/platform) must be edited from Manage Dimensions
            const isAgentTier = item.tier === EVAL_TIER.agent_adhoc;
            return (
              <DimensionCard
                key={item.binding.id}
                binding={item.binding}
                dimensionName={item.name}
                tier={item.tier}
                defaultTarget={item.defaultTarget}
                defaultTargetOperator={item.defaultTargetOperator}
                defaultWeight={item.defaultWeight}
                canEdit={canUpdateDimension && isAgentTier}
                canRemove={canUpdateSuite}
                onEdit={onEditDimension}
                onRemove={onRemoveDimension}
              />
            );
          })}
        </Box>
      ) : (
        <Typography
          variant="bodySmall"
          sx={styles.emptyText}
        >
          No dimensions added yet.
        </Typography>
      )}

      {canUpdateSuite && (
        <AddDimensionMenu
          onSelectFromLibrary={onSelectFromLibrary}
          onCreateManually={onCreateManually}
          onBuildWithAi={onBuildWithAi}
        />
      )}
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
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  emptyText: ({ palette }) => ({
    marginTop: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    fontWeight: 400,
    color: palette.text.primary,
  }),
});

export default DimensionSection;
