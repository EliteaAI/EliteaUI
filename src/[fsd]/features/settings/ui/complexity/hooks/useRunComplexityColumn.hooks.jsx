import { useMemo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { parseRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import { useAnalyticsComplexityDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';

import ComplexityLabelChip from '../components/ComplexityLabelChip';

const { NOT_SCORED_TOOLTIP, PENDING_SCORE_TOOLTIP, PENDING_WINDOW_MS } = ComplexityConstants;
const { RUN_SCORE_STATE } = ComplexityHelpers;
const MAX_IDS = 100;
// Run History has no date filter, so labels cover the retention window of scored runs
const LOOKBACK_DAYS = 400;

// Same muted italic as "Not enough runs" on the version table
const unscoredSx = ({ palette }) => ({
  color: palette.text.metrics || palette.text.disabled,
  fontStyle: 'italic',
});

// One conversation can hold several scored runs; its label follows the most complex one
const toLabelByConversation = runs => {
  const byConversation = new Map();
  (runs ?? []).forEach(run => {
    const current = byConversation.get(run.conversation_id);
    if (!current || run.cu_total > current.cu_total) byConversation.set(run.conversation_id, run);
  });
  return byConversation;
};

export const useRunComplexityColumn = ({ entityId, rows }) => {
  const projectId = useSelectedProjectId();
  const { data: platformSettings } = useGetPlatformSettingsQuery();
  const enabled = Boolean(platformSettings?.complexity_enabled);

  const conversationIds = useMemo(
    () => [...new Set((rows ?? []).map(row => row.uuid).filter(Boolean))].slice(0, MAX_IDS),
    [rows],
  );
  const range = useMemo(() => ComplexityHelpers.periodRange(LOOKBACK_DAYS), []);

  const { data } = useAnalyticsComplexityDetailQuery(
    { projectId, entityId, conversationIds, ...range, limit: 100 },
    { skip: !enabled || !projectId || !entityId || !conversationIds.length },
  );
  const byConversation = useMemo(() => toLabelByConversation(data?.runs), [data?.runs]);

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
