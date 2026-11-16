import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { EditEntityComparisonLayout, TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';
import { CopyIconButton } from '@/[fsd]/shared/ui/button';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import CompareSaveButton from '../CompareSaveButton';
import CompareVersionHeader from '../CompareVersionHeader';

const CompareInstructionsStep = memo(props => {
  const {
    leftVersion,
    rightVersion,
    leftData,
    rightData,
    leftEdits,
    rightEdits,
    onLeftEdit,
    onRightEdit,
    onSaveLeft,
    onSaveRight,
    savingLeftKeys,
    savingRightKeys,
    instructionsRequired = false,
    leftSaveDisabledReason,
    // Comparing with a public version: both sides are shown to be read and copied from, not edited or saved
    readOnly = false,
  } = props;

  const leftValue = leftEdits.instructions ?? leftData.instructions ?? '';
  const rightValue = rightEdits.instructions ?? rightData.instructions ?? '';
  const noDiff = leftValue === rightValue;

  const handleLeftChange = useCallback(val => onLeftEdit('instructions', val), [onLeftEdit]);
  const handleRightChange = useCallback(val => onRightEdit('instructions', val), [onRightEdit]);

  return (
    <EditEntityComparisonLayout
      currentLabel={<CompareVersionHeader version={leftVersion} />}
      suggestedLabel={<CompareVersionHeader version={rightVersion} />}
      currentContent={
        <Box sx={compareInstructionsStepStyles.fieldSection}>
          <Box sx={compareInstructionsStepStyles.fieldHeader}>
            <Typography
              variant="labelMedium"
              color="text.primary"
            >
              Instructions
            </Typography>
            <CopyIconButton
              value={leftValue}
              tooltip={`Copy Instructions from version ${leftVersion?.name}`}
            />
          </Box>
          {noDiff && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
              sx={compareInstructionsStepStyles.noDiffNote}
            >
              No differences in this section.
            </Typography>
          )}
          <Box sx={compareInstructionsStepStyles.editableCard}>
            <TextDiffHighlight
              original={rightValue}
              modified={leftValue}
              mode="modified"
              editable={!readOnly}
              onChange={handleLeftChange}
            />
          </Box>
          {!readOnly && (
            <CompareSaveButton
              label={`Save ${leftVersion?.name}`}
              isDirty={leftEdits.instructions !== undefined && !(instructionsRequired && !leftValue?.trim())}
              isSaving={Boolean(savingLeftKeys.instructions)}
              disabledReason={leftSaveDisabledReason}
              onClick={() => onSaveLeft({ instructions: leftValue })}
              sx={compareInstructionsStepStyles.saveBtn}
            />
          )}
        </Box>
      }
      suggestedContent={
        <Box sx={compareInstructionsStepStyles.fieldSection}>
          <Box sx={compareInstructionsStepStyles.fieldHeader}>
            <Typography
              variant="labelMedium"
              color="text.primary"
            >
              Instructions
            </Typography>
            <CopyIconButton
              value={rightValue}
              tooltip={`Copy Instructions from version ${rightVersion?.name}`}
            />
          </Box>
          {noDiff && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
              sx={compareInstructionsStepStyles.noDiffNote}
            >
              No differences in this section.
            </Typography>
          )}
          <Box sx={compareInstructionsStepStyles.editableCard}>
            <TextDiffHighlight
              original={leftValue}
              modified={rightValue}
              mode="modified"
              editable={!readOnly}
              onChange={handleRightChange}
            />
          </Box>
          {!readOnly && (
            <BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              size="small"
              disabled={
                rightEdits.instructions === undefined ||
                (instructionsRequired && !rightValue?.trim()) ||
                savingRightKeys.instructions
              }
              onClick={() => onSaveRight({ instructions: rightValue })}
              sx={compareInstructionsStepStyles.saveBtn}
            >
              {savingRightKeys.instructions ? 'Saving...' : `Save ${rightVersion?.name}`}
            </BaseBtn>
          )}
        </Box>
      }
    />
  );
});

CompareInstructionsStep.displayName = 'CompareInstructionsStep';

/** @type {MuiSx} */
const compareInstructionsStepStyles = {
  fieldSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 2rem 1.25rem',
    flex: 1,
    minHeight: 0,
  },
  fieldHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noDiffNote: {
    fontStyle: 'italic',
  },
  editableCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: palette.border.hover },
    '&:focus-within': { borderColor: palette.primary.main },
  }),
  saveBtn: {
    alignSelf: 'flex-end',
  },
};

export default CompareInstructionsStep;
