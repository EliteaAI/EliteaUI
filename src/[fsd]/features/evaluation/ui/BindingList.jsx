import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { EVAL_BINDING_KIND } from '../lib/constants';
import { getBindingKind, groupBindings } from '../lib/helpers';
import BindingRow from './BindingRow';

const GROUP_ORDER = [
  { kind: EVAL_BINDING_KIND.dimension, title: 'Dimensions' },
  { kind: EVAL_BINDING_KIND.codeValidation, title: 'Code validations' },
  { kind: EVAL_BINDING_KIND.platform, title: 'Platform validations' },
];

const BindingList = memo(props => {
  const {
    bindings = [],
    dimensions = [],
    codeValidations = [],
    canEdit = false,
    onEdit,
    onRemove,
    onReorder,
    isReordering = false,
  } = props;

  // Disabled while a reorder request is in flight: a second drag started before the
  // first mutation's cache-invalidation refetch lands would compute its full order from
  // an already-stale `bindings` snapshot and silently clobber the pending change.
  const canReorder = canEdit && !!onReorder && !isReordering;
  const groups = useMemo(() => groupBindings(bindings), [bindings]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Groups are a UI-only split of one flat, order_index-driven list (§13.1). A
  // drag within a group's SortableContext only reorders that group's ids, so we
  // splice the new sub-order back into the full list at the same slot positions
  // to build the complete binding_ids array the reorder endpoint expects.
  const handleDragEnd = useCallback(
    (kind, groupItems) =>
      ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const groupIds = groupItems.map(item => item.id);
        const fromIndex = groupIds.indexOf(active.id);
        const toIndex = groupIds.indexOf(over.id);
        if (fromIndex === -1 || toIndex === -1) return;
        const reorderedGroupIds = arrayMove(groupIds, fromIndex, toIndex);
        let cursor = 0;
        const fullOrder = bindings.map(binding =>
          getBindingKind(binding) === kind ? reorderedGroupIds[cursor++] : binding.id,
        );
        onReorder?.(fullOrder);
      },
    [bindings, onReorder],
  );

  const styles = bindingListStyles();

  if (!bindings.length) {
    return (
      <Typography
        variant="bodySmall"
        color="text.secondary"
        data-testid="evaluation-bindings-empty"
      >
        No validations added yet. Use “+ Add” to attach dimensions or code validations.
      </Typography>
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-bindings-list"
    >
      {GROUP_ORDER.map(({ kind, title }) => {
        const items = groups[kind];
        if (!items?.length) return null;
        const itemIds = items.map(item => item.id);
        const rows = items.map(binding => (
          <BindingRow
            key={binding.id}
            binding={binding}
            dimensions={dimensions}
            codeValidations={codeValidations}
            canEdit={canEdit}
            canReorder={canReorder}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ));
        return (
          <Box
            key={kind}
            sx={styles.group}
          >
            <Typography
              variant="labelSmall"
              color="text.secondary"
            >
              {title} ({items.length})
            </Typography>
            <Box sx={styles.rows}>
              {canReorder ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd(kind, items)}
                >
                  <SortableContext
                    items={itemIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {rows}
                  </SortableContext>
                </DndContext>
              ) : (
                rows
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
});

BindingList.displayName = 'BindingList';

/** @type {MuiSx} */
const bindingListStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
});

export default BindingList;
