import { MAX_BADGE_COUNT } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/timeLine.constants';

/**
 * Splits steps into runs of consecutive steps that share a `group_id`.
 * A step without a `group_id` always forms a group of its own.
 */
export const groupConsecutiveSteps = steps => {
  const groups = [];
  steps.forEach((step, index) => {
    const previous = groups.at(-1);
    if (step.group_id && previous?.groupId === step.group_id) {
      previous.end = index;
    } else {
      groups.push({ groupId: step.group_id, start: index, end: index });
    }
  });
  return groups;
};

/**
 * Lists the rows to draw. A group is expanded when the "expand all" mode differs from its own override,
 * so groups that arrive during a live run follow the mode without being tracked individually.
 */
export const getVisibleSteps = (groups, expandAll, toggledGroups) =>
  groups.flatMap(({ start, end }) => {
    const expanded = end > start && expandAll !== toggledGroups.has(start);
    const rows = [{ index: start, end, expanded }];
    if (expanded) {
      for (let index = start + 1; index <= end; index++) {
        rows.push({ index, end: index });
      }
    }
    return rows;
  });

/** Position of the row that holds the running step, or -1 when nothing is running. */
export const getActiveRowPosition = (visibleSteps, inProgressStep) =>
  visibleSteps.findIndex(({ index, end, expanded }) =>
    expanded ? index === inProgressStep : index <= inProgressStep && inProgressStep <= end,
  );

/** Text for a count badge. Counts above the cap collapse to e.g. `99+`; the exact value belongs in a label. */
export const formatBadgeCount = count => (count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count);

/** A row is active when it is selected, or when it is a collapsed group that holds the selected step. */
export const isRowActive = (index, end, expanded, selectedStep) =>
  index === selectedStep || (!expanded && index < selectedStep && selectedStep <= end);
