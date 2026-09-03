import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_PERMISSIONS } from '../../../lib/constants';
import AddDimensionMenu from './AddDimensionMenu';
import DimensionCard from './DimensionCard';

const DimensionSection = memo(props => {
  const {
    attachedDimensions = [],
    onSelectFromLibrary,
    onCreateManually,
    onBuildWithAi,
    onEditDimension,
    onRemoveDimension,
  } = props;

  const { checkPermission } = useCheckPermission();
  const canUpdateSuite = checkPermission(EVAL_PERMISSIONS.suiteUpdate);

  const hasAttachedDimensions = attachedDimensions.length > 0;

  const styles = dimensionSectionStyles();

  return (
    <Box sx={styles.root}>
      {hasAttachedDimensions ? (
        <Box sx={styles.cardList}>
          {attachedDimensions.map(item => (
            <DimensionCard
              key={item.binding.id}
              binding={item.binding}
              dimensionName={item.name}
              tier={item.tier}
              defaultTarget={item.defaultTarget}
              defaultTargetOperator={item.defaultTargetOperator}
              defaultWeight={item.defaultWeight}
              canEdit={canUpdateSuite}
              onEdit={onEditDimension}
              onRemove={onRemoveDimension}
            />
          ))}
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
