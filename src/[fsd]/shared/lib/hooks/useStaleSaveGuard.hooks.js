import { useCallback, useRef } from 'react';

import { useParams } from 'react-router-dom';

const toId = value => (value === undefined || value === null || value === '' ? null : String(value));

/**
 * Detects that the page moved to another entity while an async save was in flight.
 *
 * The editor page is not remounted when the route goes from one agent or pipeline to another, so a save
 * response that arrives late would otherwise reset the next entity's form with the previous entity's data.
 * `captureSaveTarget()` is called when the save starts; `isSaveTargetCurrent(target)` when it resolves.
 */
export const useStaleSaveGuard = currentEntityId => {
  const { agentId } = useParams();
  const liveRef = useRef(null);
  // Updated during render, so a response that resolves before the next effects flush still sees the new page
  liveRef.current = { entityId: toId(currentEntityId), routeId: toId(agentId) };

  const captureSaveTarget = useCallback(
    () => ({ entityId: toId(currentEntityId), routeId: toId(agentId) }),
    [agentId, currentEntityId],
  );

  const isSaveTargetCurrent = useCallback(target => {
    const live = liveRef.current;
    // The chat editor has no entity id in its URL, so the route check applies only where one exists
    const isSameRoute = !target.routeId || target.routeId === live.routeId;
    return isSameRoute && target.entityId === live.entityId;
  }, []);

  return { captureSaveTarget, isSaveTargetCurrent };
};
