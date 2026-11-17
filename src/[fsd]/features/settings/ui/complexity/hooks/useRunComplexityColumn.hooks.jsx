import { useEffect, useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';

import { Box, Tooltip, Typography } from '@mui/material';

import { parseRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import { analyticsApi } from '@/[fsd]/features/settings/api/analyticsApi';
import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';

import ComplexityLabelChip from '../components/ComplexityLabelChip';

const { NOT_SCORED_TOOLTIP, PENDING_SCORE_TOOLTIP, PENDING_WINDOW_MS } = ComplexityConstants;
const { RUN_SCORE_STATE } = ComplexityHelpers;
// One request per Run History page; the API returns at most one row per id, so nothing is cut off
const CHUNK_SIZE = 20;
// Run History has no date filter, so labels cover the retention window of scored runs
const LOOKBACK_DAYS = 400;

// Same muted italic as "Not enough runs" on the version table
const unscoredSx = ({ palette }) => ({
  color: palette.text.metrics || palette.text.disabled,
  fontStyle: 'italic',
});

const chunkIds = ids => {
  const chunks = [];
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) chunks.push(ids.slice(i, i + CHUNK_SIZE));
  return chunks;
};

export const useRunComplexityColumn = ({ entityId, rows }) => {
  const projectId = useSelectedProjectId();
  const dispatch = useDispatch();
  const { data: platformSettings } = useGetPlatformSettingsQuery();
  const enabled = Boolean(platformSettings?.complexity_enabled);

  const chunks = useMemo(
    () => chunkIds([...new Set((rows ?? []).map(row => row.uuid).filter(Boolean))]),
    [rows],
  );
  const range = useMemo(() => ComplexityHelpers.periodRange(LOOKBACK_DAYS), []);
  const [byConversation, setByConversation] = useState(() => new Map());

  // Chunks already loaded come from the RTK cache, so Load more only requests the new page's ids
  useEffect(() => {
    if (!enabled || !projectId || !entityId || !chunks.length) return undefined;
    const subscriptions = chunks.map(conversationIds =>
      dispatch(
        analyticsApi.endpoints.analyticsComplexityDetail.initiate({
          projectId,
          entityId,
          conversationIds,
          ...range,
          limit: conversationIds.length,
        }),
      ),
    );
    let cancelled = false;
    Promise.all(subscriptions.map(subscription => subscription.unwrap().catch(() => null))).then(results => {
      if (cancelled) return;
      const next = new Map();
      results.forEach(result => (result?.runs ?? []).forEach(run => next.set(run.conversation_id, run)));
      setByConversation(next);
    });
    return () => {
      cancelled = true;
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [enabled, projectId, entityId, chunks, range, dispatch]);

  return useMemo(() => {
    if (!enabled) return null;
    return {
      id: 'complexity',
      // Short header so the chip column stays narrow; the full name shows on hover
      label: 'CU',
      title: 'Complexity',
      width: '5.5rem',
      render: row => {
        const run = byConversation.get(row.uuid);
        const state = ComplexityHelpers.runScoreState(
          run,
          parseRunTimestamp(row.updated_at || row.created_at),
          PENDING_WINDOW_MS,
        );
        if (state !== RUN_SCORE_STATE.scored) {
          const pending = state === RUN_SCORE_STATE.pending;
          return (
            <Tooltip
              title={pending ? PENDING_SCORE_TOOLTIP : NOT_SCORED_TOOLTIP}
              placement="top"
            >
              <Typography
                variant="bodySmall"
                sx={unscoredSx}
                data-testid={pending ? 'run-complexity-pending' : 'run-complexity-not-scored'}
              >
                {pending ? 'Pending' : '—'}
              </Typography>
            </Tooltip>
          );
        }
        return (
          <Tooltip
            title={ComplexityHelpers.runTooltip(run)}
            placement="top"
          >
            <Box component="span">
              <ComplexityLabelChip
                label={run.label}
                testId="run-complexity-label"
              />
            </Box>
          </Tooltip>
        );
      },
    };
  }, [enabled, byConversation]);
};
