import { EDIT_STEP_KEYS, STEP_LABELS } from '../constants';

export const computeVisibleSteps = (currentData, draftData) => {
  const currentName = currentData?.name || '';
  const currentDescription = currentData?.description || '';
  const currentInstructions = currentData?.version_details?.instructions || '';

  const suggestedName = draftData?.name || '';
  const suggestedDescription = draftData?.description || '';
  const suggestedInstructions = draftData?.instructions || '';

  const generalChanged = currentName !== suggestedName || currentDescription !== suggestedDescription;
  const instructionsChanged = currentInstructions !== suggestedInstructions;
  const nothingChanged = !generalChanged && !instructionsChanged;

  const steps = [];

  // With no changes to diff, show every step so the user still gets the full wizard.
  if (generalChanged || nothingChanged)
    steps.push({ key: EDIT_STEP_KEYS.GENERAL, label: STEP_LABELS[EDIT_STEP_KEYS.GENERAL] });

  if (instructionsChanged || nothingChanged)
    steps.push({ key: EDIT_STEP_KEYS.INSTRUCTIONS, label: STEP_LABELS[EDIT_STEP_KEYS.INSTRUCTIONS] });

  steps.push({ key: EDIT_STEP_KEYS.SUMMARY, label: STEP_LABELS[EDIT_STEP_KEYS.SUMMARY] });

  return steps;
};
