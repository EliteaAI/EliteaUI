import { memo, useCallback, useMemo, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, Link, Typography, useTheme } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

import UsageSortHeader from './UsageSortHeader';

const MAX_ROWS = 5;

const BADGE_COLORS = {
  pipeline: { bg: '#2a1a3a', text: '#b98cff' },
};

const UsageTopAgents = memo(props => {
  const { topAgents = [], canSeeAmounts, currency, comparisonAgents = [], analyticsUrl, sx = {} } = props;

  const { palette } = useTheme();
  const styles = usageTopAgentsStyles();

  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');

  const prevByName = useMemo(() => {
    const map = new Map();

    comparisonAgents.forEach(a => map.set(a.name || a.id, a));

    return map;
  }, [comparisonAgents]);

  const totalSpend = useMemo(() => topAgents.reduce((sum, a) => sum + (a.spend || 0), 0), [topAgents]);

  const enrichedAgents = useMemo(
    () =>
      topAgents.map((agent, idx) => {
        const key = agent.name || agent.id || String(idx);
        const prev = prevByName.get(key);
        const delta = UsageHelpers.computeDelta(agent.spend ?? 0, prev?.spend ?? null);
        const perRun = agent.runs ? (agent.spend || 0) / agent.runs : 0;

        return { ...agent, _key: key, _delta: delta, _perRun: perRun };
      }),
    [topAgents, prevByName],
  );

  const sortedAgents = useMemo(() => {
    return [...enrichedAgents].sort((a, b) => {
      if (sortKey === 'name') {
        const aStr = (a.name || a.id || '').toLowerCase();
        const bStr = (b.name || b.id || '').toLowerCase();
        return sortDir === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
      }

      let av, bv;

      if (sortKey === 'runs') {
        av = a.runs || 0;
        bv = b.runs || 0;
      } else if (sortKey === 'perRun') {
        av = a._perRun;
        bv = b._perRun;
      } else if (sortKey === 'delta') {
        av = a._delta?.pct ?? -Infinity;
        bv = b._delta?.pct ?? -Infinity;
      } else {
        av = a.spend || 0;
        bv = b.spend || 0;
      }

      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [enrichedAgents, sortKey, sortDir]);

  const handleSort = useCallback(
    key => {
      if (sortKey === key) {
        setSortDir(prev => (prev === 'desc' ? 'asc' : 'desc'));
      } else {
        setSortKey(key);
        setSortDir('desc');
      }
    },
    [sortKey],
  );

  if (!topAgents.length) return null;

  const visibleAgents = sortedAgents.slice(0, MAX_ROWS);

  return (
    <Box
      sx={[styles.card, sx]}
      data-testid="usage-top-agents"
    >
      <Box sx={styles.titleRow}>
        <Typography
          variant="labelMedium"
          sx={styles.title}
        >
          Top agents and pipelines
        </Typography>
        {analyticsUrl && (
          <Link
            component={RouterLink}
            to={analyticsUrl}
            sx={styles.viewLink}
          >
            View in Analytics
          </Link>
        )}
      </Box>

      <Box sx={styles.tableWrapper}>
        <Box sx={styles.tableHeader}>
          <Box
            sx={[styles.cell, styles.sortableCell, { flex: 3 }]}
            onClick={() => handleSort('name')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleSort('name')}
          >
            <Typography sx={[styles.cellText, sortKey === 'name' ? { color: palette.primary.main } : {}]}>
              Name
              {sortKey === 'name' && <Box component="span">{sortDir === 'desc' ? ' ▼' : ' ▲'}</Box>}
            </Typography>
          </Box>
          <UsageSortHeader
            label="Runs"
            keyName="runs"
            flex={1}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <UsageSortHeader
            label={canSeeAmounts ? 'Spend' : 'Share'}
            keyName="spend"
            flex={1.2}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <UsageSortHeader
            label="Per run"
            keyName="perRun"
            flex={1.2}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <UsageSortHeader
            label="vs prior"
            keyName="delta"
            flex={0.9}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </Box>

        {visibleAgents.map(agent => {
          const delta = agent._delta;
          const isAgent = (agent.type || '').toLowerCase() !== 'pipeline';
          const badge = isAgent
            ? { bg: '#1a3a3a', text: palette.text.success || '#4fd1a5' }
            : BADGE_COLORS.pipeline;
          const badgeText = isAgent ? 'AG' : 'PL';
          const share = totalSpend > 0 ? ((agent.spend || 0) / totalSpend) * 100 : 0;

          const deltaColor =
            delta.direction === 'up'
              ? palette.warning.main
              : delta.direction === 'down'
                ? palette.success.main
                : delta.direction === 'new'
                  ? palette.info?.main || palette.primary.main
                  : palette.text.disabled;

          return (
            <Box
              key={agent._key}
              sx={styles.row}
            >
              <Box sx={[{ flex: 3, minWidth: 0 }, styles.nameCell]}>
                <Box sx={styles.badge(badge)}>{badgeText}</Box>
                <Typography sx={styles.name}>{agent.name || agent.id}</Typography>
              </Box>
              <Typography sx={[styles.value, styles.right, { flex: 1 }]}>{agent.runs ?? '—'}</Typography>
              <Typography sx={[styles.value, styles.right, { flex: 1.2 }]}>
                {canSeeAmounts ? UsageHelpers.formatMoney(agent.spend, currency) : `${share.toFixed(1)}%`}
              </Typography>
              <Typography
                sx={[
                  styles.value,
                  styles.right,
                  { flex: 1.2, color: palette.text.metrics || palette.text.disabled },
                ]}
              >
                {canSeeAmounts && agent.runs ? UsageHelpers.formatMoney(agent._perRun, currency) : '—'}
              </Typography>
              <Typography
                sx={[styles.value, styles.right, { flex: 0.9, color: deltaColor, fontWeight: 600 }]}
              >
                {delta.direction === 'up' ? '▲ ' : delta.direction === 'down' ? '▼ ' : ''}
                {delta.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

UsageTopAgents.displayName = 'UsageTopAgents';

/** @type {MuiSx} */
const usageTopAgentsStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    flex: 1,
    minWidth: 0,
  }),
  titleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  viewLink: ({ palette }) => ({
    fontSize: '0.75rem',
    color: palette.primary.main,
    textDecoration: 'none',
    flexShrink: 0,
    '&:hover': { textDecoration: 'underline' },
  }),
  tableWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.375rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  row: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    '&:last-of-type': { borderBottom: 'none' },
  }),
  cell: {
    display: 'flex',
    alignItems: 'center',
  },
  sortableCell: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  cellText: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: palette.text.metrics || palette.text.disabled,
  }),
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    minWidth: 0,
  },
  badge: ({ bg, text }) => ({
    fontSize: '0.5625rem',
    fontWeight: 700,
    padding: '0.0625rem 0.25rem',
    borderRadius: '0.1875rem',
    backgroundColor: bg,
    color: text,
    flexShrink: 0,
  }),
  name: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  value: ({ palette }) => ({
    fontSize: '0.8125rem',
    color: palette.text.secondary,
  }),
  right: {
    textAlign: 'right',
    justifyContent: 'flex-end',
  },
});

export default UsageTopAgents;
