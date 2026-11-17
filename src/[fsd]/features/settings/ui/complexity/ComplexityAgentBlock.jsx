import { memo, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useAnalyticsComplexityDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { ComplexityConstants } from '@/[fsd]/features/settings/lib/constants';
import { ComplexityHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { AnalyticsBreakdownTable } from '@/[fsd]/features/settings/ui/analytics';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';

import ComplexityBreakdownBar from './components/ComplexityBreakdownBar';
import ComplexityBreakdownLegend from './components/ComplexityBreakdownLegend';
import ComplexityInfo from './components/ComplexityInfo';
import ComplexityLabelChip from './components/ComplexityLabelChip';

const { DEFAULT_PERIOD_DAYS, DEFAULT_THRESHOLDS_NOTE, PERIOD_OPTIONS, STALE_NOTE } = ComplexityConstants;

const versionName = (versions, versionId) =>
  versions?.find(version => version.id === versionId)?.name ?? (versionId ? `#${versionId}` : '—');

const ComplexityAgentBlock = memo(props => {
  const { entityId, versions } = props;

  const projectId = useSelectedProjectId();
  const { data: platformSettings } = useGetPlatformSettingsQuery();
  const enabled = Boolean(platformSettings?.complexity_enabled);

  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS);
  const range = useMemo(() => ComplexityHelpers.periodRange(periodDays), [periodDays]);
  const { data, isFetching, isError } = useAnalyticsComplexityDetailQuery(
    { projectId, entityId, ...range, limit: 1 },
    { skip: !enabled || !projectId || !entityId },
  );

  const styles = complexityAgentBlockStyles();

  const versionColumns = useMemo(
    () => [
      { key: 'version', label: 'Version', flex: 1.4, render: row => versionName(versions, row.version_id) },
      { key: 'runs', label: 'Runs', flex: 0.6 },
      {
        key: 'cu_median',
        label: 'Median CU',
        flex: 0.9,
        render: row => ComplexityHelpers.formatCu(row.cu_median),
      },
      {
        key: 'label',
        label: 'Complexity',
        flex: 1.1,
        render: row => (
          <ComplexityLabelChip
            label={row.label}
            pending={row.label_pending}
            testId="complexity-version-label"
          />
        ),
      },
      {
        key: 'percentile',
        label: 'Percentile',
        flex: 0.8,
        render: row => ComplexityHelpers.formatPercentile(row.percentile),
      },
      {
        key: 'breakdown',
        label: 'Breakdown',
        flex: 1.6,
        render: row => <ComplexityBreakdownBar breakdown={row.breakdown} />,
      },
    ],
    [versions],
  );
  const versionRows = useMemo(
    () => (data?.versions ?? []).map(row => ({ ...row, key: row.version_id ?? 'none' })),
    [data?.versions],
  );

  // A failed read (e.g. no analytics access) hides the block rather than claiming there are no runs
  if (!enabled || isError) return null;

  const summary = data?.summary;
  const meta = data?.meta;

  return (
    <Box
      sx={styles.block}
      data-testid="complexity-agent-block"
    >
      <Box sx={styles.headerRow}>
        <Typography variant="labelMedium">Complexity</Typography>
        <InfoTooltip
          pinnable
          label="About complexity"
          infoTooltip={{ title: <ComplexityInfo meta={meta} />, icon: { width: 12, height: 12 } }}
          testId="complexity-agent-info-icon"
        />
        <Box sx={styles.spacer} />
        <Box sx={styles.periodSelect}>
          <SingleSelect
            separateLabel
            label=""
            value={periodDays}
            options={PERIOD_OPTIONS}
            onValueChange={setPeriodDays}
            data-testid="complexity-agent-period-select"
          />
        </Box>
      </Box>

      {summary ? (
        <Box sx={styles.summaryRow}>
          <ComplexityLabelChip
            label={summary.label}
            pending={summary.label_pending}
            testId="complexity-agent-label"
          />
          <Typography variant="bodySmall">
            Median {ComplexityHelpers.formatCu(summary.cu_median)} CU · Max{' '}
            {ComplexityHelpers.formatCu(summary.cu_max)} CU ·{' '}
            {ComplexityHelpers.formatPercentile(summary.percentile)} · {summary.runs} runs, all versions
          </Typography>
          <Box sx={styles.bar}>
            <ComplexityBreakdownBar breakdown={summary.breakdown} />
          </Box>
        </Box>
      ) : (
        <Typography
          variant="bodySmall"
          sx={styles.note}
          data-testid="complexity-agent-empty"
        >
          {isFetching ? 'Loading…' : 'No scored runs in this period.'}
        </Typography>
      )}

      {versionRows.length > 0 && (
        <AnalyticsBreakdownTable
          title="By version"
          subtitle={<ComplexityBreakdownLegend />}
          columns={versionColumns}
          rows={versionRows}
          testId="complexity-versions-table"
        />
      )}

      {meta && (
        <Typography
          variant="bodySmall"
          sx={styles.note}
          data-testid="complexity-agent-notes"
        >
          {ComplexityHelpers.freshnessNote(meta)}
          {meta.thresholds_source === 'default' ? ` ${DEFAULT_THRESHOLDS_NOTE}` : ''}
          {meta.stale ? ` ${STALE_NOTE}` : ''}
        </Typography>
      )}
    </Box>
  );
});

ComplexityAgentBlock.displayName = 'ComplexityAgentBlock';

/** @type {MuiSx} */
const complexityAgentBlockStyles = () => ({
  block: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
  }),
  headerRow: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  spacer: { flex: 1 },
  periodSelect: { minWidth: '10rem' },
  summaryRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  bar: { width: '12rem' },
  note: ({ palette }) => ({ color: palette.text.metrics || palette.text.secondary }),
});

export default ComplexityAgentBlock;
