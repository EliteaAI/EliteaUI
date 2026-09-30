import { memo } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { Banner, Checkbox } from '@/[fsd]/shared/ui';

import GeneratedDimensionCard from './GeneratedDimensionCard';

const GeneratedDimensionsList = memo(props => {
  const {
    drafts,
    selectedIds,
    isAllSelected,
    isIndeterminate,
    saveError,
    isDisabled = false,
    onToggle,
    onToggleAll,
    onOpen,
  } = props;

  const styles = generatedDimensionsListStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="build-dimension-select-list"
    >
      <Typography
        variant="bodyMedium"
        sx={styles.hint}
      >
        Select the dimensions you want to create. Open any dimension to review or customize its settings.
      </Typography>
      {saveError && (
        <Box data-testid="build-dimension-save-error">
          <Banner.BannerMessage
            variant="error"
            message={saveError}
            containerSx={styles.banner}
          />
        </Box>
      )}
      <FormControlLabel
        sx={styles.selectAll}
        control={
          <Checkbox.BaseCheckbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={onToggleAll}
            disabled={isDisabled}
            sx={styles.checkbox}
            data-testid="build-dimension-select-all"
          />
        }
        label={<Typography variant="bodyMedium">{`Select all (${drafts.length})`}</Typography>}
      />
      <Box sx={styles.list}>
        {drafts.map(draft => (
          <GeneratedDimensionCard
            key={draft.id}
            id={draft.id}
            form={draft.form}
            isSelected={selectedIds.has(draft.id)}
            isDisabled={isDisabled}
            onToggle={onToggle}
            onOpen={onOpen}
          />
        ))}
      </Box>
    </Box>
  );
});

GeneratedDimensionsList.displayName = 'GeneratedDimensionsList';

/** @type {MuiSx} */
const generatedDimensionsListStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  hint: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  banner: {
    marginTop: 0,
  },
  selectAll: ({ palette }) => ({
    marginLeft: 0,
    marginRight: 0,
    gap: '1rem',
    alignSelf: 'flex-start',
    color: palette.text.secondary,
  }),
  checkbox: {
    padding: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
});

export default GeneratedDimensionsList;
