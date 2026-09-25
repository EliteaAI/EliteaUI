import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { BUILD_DIMENSION_STEPS } from '../../lib/constants';

const BuildDimensionWithAiActions = memo(props => {
  const {
    step,
    canGenerate,
    selectedCount,
    isSaving,
    onCancel,
    onGenerate,
    onRefinePrompt,
    onSaveSelected,
    onSaveDraftAndBack,
    onBackToList,
  } = props;

  const styles = buildDimensionWithAiActionsStyles();

  if (step === BUILD_DIMENSION_STEPS.review) {
    return (
      <>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.secondary}
          onClick={onBackToList}
          data-testid="build-dimension-back-to-list-button"
        >
          Back to list
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          onClick={onSaveDraftAndBack}
          data-testid="build-dimension-save-and-back-button"
        >
          Save and back to list
        </Button.BaseBtn>
      </>
    );
  }

  if (step === BUILD_DIMENSION_STEPS.select) {
    return (
      <>
        <Box sx={styles.side}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={onRefinePrompt}
            disabled={isSaving}
            data-testid="build-dimension-refine-prompt-button"
          >
            Refine Prompt
          </Button.BaseBtn>
        </Box>
        <Typography
          variant="bodyMedium"
          sx={styles.counter}
          data-testid="build-dimension-selected-count"
        >
          {`${selectedCount} selected`}
        </Typography>
        <Box sx={[styles.side, styles.sideRight]}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={onCancel}
            disabled={isSaving}
            data-testid="build-dimension-cancel-button"
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            onClick={onSaveSelected}
            disabled={!selectedCount || isSaving}
            data-testid="build-dimension-save-button"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button.BaseBtn>
        </Box>
      </>
    );
  }

  const isLoading = step === BUILD_DIMENSION_STEPS.loading;

  return (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={onCancel}
        data-testid="build-dimension-cancel-button"
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        disabled={isLoading || !canGenerate}
        onClick={onGenerate}
        data-testid="build-dimension-generate-button"
      >
        Generate Draft
      </Button.BaseBtn>
    </>
  );
});

BuildDimensionWithAiActions.displayName = 'BuildDimensionWithAiActions';

/** @type {MuiSx} */
const buildDimensionWithAiActionsStyles = () => ({
  side: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  counter: ({ palette }) => ({
    color: palette.text.primary,
    whiteSpace: 'nowrap',
  }),
});

export default BuildDimensionWithAiActions;
