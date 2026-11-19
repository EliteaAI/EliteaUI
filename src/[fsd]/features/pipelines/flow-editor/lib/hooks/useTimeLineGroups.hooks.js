import { useCallback, useMemo, useState } from 'react';

import {
  getVisibleSteps,
  groupConsecutiveSteps,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/timeLine.helpers';

export const useTimeLineGroups = (steps, selectedStep, onSelect) => {
  const [expandAll, setExpandAll] = useState(false);
  const [toggledGroups, setToggledGroups] = useState(() => new Set());

  const groups = useMemo(() => groupConsecutiveSteps(steps), [steps]);
  const visibleSteps = useMemo(
    () => getVisibleSteps(groups, expandAll, toggledGroups),
    [groups, expandAll, toggledGroups],
  );
  const hasGroups = useMemo(() => groups.some(({ start, end }) => end > start), [groups]);

  const toggleGroup = useCallback(
    (start, end, expanded) => {
      setToggledGroups(previous => {
        const next = new Set(previous);
        if (next.has(start)) next.delete(start);
        else next.add(start);
        return next;
      });
      // Collapsing hides the selected child, so the group head takes over the selection.
      if (expanded && selectedStep > start && selectedStep <= end) onSelect(start);
    },
    [onSelect, selectedStep],
  );

  const toggleExpandAll = useCallback(
    (_, checked) => {
      setExpandAll(checked);
      setToggledGroups(new Set());
      if (!checked) {
        const selectedGroup = groups.find(({ start, end }) => selectedStep > start && selectedStep <= end);
        if (selectedGroup) onSelect(selectedGroup.start);
      }
    },
    [groups, onSelect, selectedStep],
  );

  return { expandAll, hasGroups, visibleSteps, toggleGroup, toggleExpandAll };
};
