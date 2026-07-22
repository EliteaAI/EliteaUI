import { EDIT_STEP_KEYS, STEP_LABELS } from '../constants';

const hasArrayItems = arr => Array.isArray(arr) && arr.length > 0;

const startersChanged = (currentStarters, suggestedStarters) => {
  const a = (currentStarters || []).filter(Boolean);
  const b = (suggestedStarters || []).filter(Boolean);

  if (a.length !== b.length) return true;

  return a.some((val, i) => val !== b[i]);
};

export const computeVisibleSteps = (currentData, draftData) => {
  const steps = [];

  const currentName = currentData.name || '';
  const currentDescription = currentData.description || '';
  const currentInstructions = currentData.version_details?.instructions || '';
  const currentWelcome = currentData.version_details?.welcome_message || '';
  const currentStarters = currentData.version_details?.conversation_starters || [];

  const suggestedName = draftData.name || '';
  const suggestedDescription = draftData.description || '';
  const suggestedInstructions = draftData.instructions || '';
  const suggestedWelcome = draftData.welcome_message || '';
  const suggestedStarters = draftData.conversation_starters || [];

  if (currentName !== suggestedName || currentDescription !== suggestedDescription)
    steps.push({ key: EDIT_STEP_KEYS.GENERAL, label: STEP_LABELS[EDIT_STEP_KEYS.GENERAL] });

  if (currentInstructions !== suggestedInstructions)
    steps.push({ key: EDIT_STEP_KEYS.INSTRUCTIONS, label: STEP_LABELS[EDIT_STEP_KEYS.INSTRUCTIONS] });

  if (currentWelcome !== suggestedWelcome || startersChanged(currentStarters, suggestedStarters))
    steps.push({
      key: EDIT_STEP_KEYS.USER_INTERACTION,
      label: STEP_LABELS[EDIT_STEP_KEYS.USER_INTERACTION],
    });

  const hasToolSuggestions =
    hasArrayItems(draftData.suggested_toolkits) ||
    hasArrayItems(draftData.suggested_mcp) ||
    hasArrayItems(draftData.suggested_agents) ||
    hasArrayItems(draftData.suggested_pipelines) ||
    hasArrayItems(draftData.suggested_skills) ||
    hasArrayItems(currentData?.version_details?.tools);

  if (hasToolSuggestions)
    steps.push({ key: EDIT_STEP_KEYS.TOOLS_SKILLS, label: STEP_LABELS[EDIT_STEP_KEYS.TOOLS_SKILLS] });

  steps.push({ key: EDIT_STEP_KEYS.SUMMARY, label: STEP_LABELS[EDIT_STEP_KEYS.SUMMARY] });

  return steps;
};
