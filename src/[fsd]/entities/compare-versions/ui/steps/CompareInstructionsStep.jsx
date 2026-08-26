import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { EditEntityComparisonLayout, TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CopyIcon from '@/components/Icons/CopyIcon';
import useToast from '@/hooks/useToast';

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
  } = props;

  const { toastSuccess } = useToast();

  const leftValue = leftEdits.instructions ?? leftData.instructions ?? '';
  const rightValue = rightEdits.instructions ?? rightData.instructions ?? '';
  const noDiff = leftValue === rightValue;

  const handleLeftChange = useCallback(val => onLeftEdit('instructions', val), [onLeftEdit]);
  const handleRightChange = useCallback(val => onRightEdit('instructions', val), [onRightEdit]);

  const handleCopyLeft = useCallback(() => {
    navigator.clipboard.writeText(leftValue).then(() => toastSuccess('Copied to clipboard.'));
  }, [leftValue, toastSuccess]);

  const handleCopyRight = useCallback(() => {
    navigator.clipboard.writeText(rightValue).then(() => toastSuccess('Copied to clipboard.'));
  }, [rightValue, toastSuccess]);

  return (
    <EditEntityComparisonLayout
      currentLabel={<CompareVersionHeader version={leftVersion} />}
      suggestedLabel={<CompareVersionHeader version={rightVersion} />}
      currentContent={
        <Box sx={compareInstructionsStepStyles.fieldSection}>
          <Box sx={compareInstructionsStepStyles.fieldHeader}>
            <Typography sx={compareInstructionsStepStyles.fieldLabel}>Instructions</Typography>
            <Tooltip
              title={`Copy Instructions from version ${leftVersion?.name}`}
              placement="top"
            >
              <BaseBtn
                variant={BUTTON_VARIANTS.secondary}
                size="small"
                startIcon={<CopyIcon />}
                onClick={handleCopyLeft}
              />
            </Tooltip>
          </Box>
          {noDiff && (
            <Typography sx={compareInstructionsStepStyles.noDiffNote}>
              No differences in this section.
            </Typography>
          )}
          <Box sx={compareInstructionsStepStyles.editableCard}>
            <TextDiffHighlight
              original={rightValue}
              modified={leftValue}
              mode="modified"
              editable
              onChange={handleLeftChange}
            />
          </Box>
          <BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            size="small"
            disabled={leftEdits.instructions === undefined || savingLeftKeys.instructions}
            onClick={() => onSaveLeft({ instructions: leftValue })}
            sx={compareInstructionsStepStyles.saveBtn}
          >
            {savingLeftKeys.instructions ? 'Saving...' : `Save ${leftVersion?.name}`}
          </BaseBtn>
        </Box>
      }
      suggestedContent={
        <Box sx={compareInstructionsStepStyles.fieldSection}>
          <Box sx={compareInstructionsStepStyles.fieldHeader}>
            <Typography sx={compareInstructionsStepStyles.fieldLabel}>Instructions</Typography>
            <Tooltip
              title={`Copy Instructions from version ${rightVersion?.name}`}
              placement="top"
            >
              <BaseBtn
                variant={BUTTON_VARIANTS.secondary}
                startIcon={<CopyIcon />}
                onClick={handleCopyRight}
              />
            </Tooltip>
          </Box>
          {noDiff && (
            <Typography sx={compareInstructionsStepStyles.noDiffNote}>
              No differences in this section.
            </Typography>
          )}
          <Box sx={compareInstructionsStepStyles.editableCard}>
            <TextDiffHighlight
              original={leftValue}
              modified={rightValue}
              mode="modified"
              editable
              onChange={handleRightChange}
            />
          </Box>
          <BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            size="small"
            disabled={rightEdits.instructions === undefined || savingRightKeys.instructions}
            onClick={() => onSaveRight({ instructions: rightValue })}
            sx={compareInstructionsStepStyles.saveBtn}
          >
            {savingRightKeys.instructions ? 'Saving...' : `Save ${rightVersion?.name}`}
          </BaseBtn>
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
  fieldLabel: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    color: 'text.primary',
  },
  noDiffNote: {
    fontSize: '0.75rem',
    color: 'text.secondary',
    fontStyle: 'italic',
  },
  editableCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
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
