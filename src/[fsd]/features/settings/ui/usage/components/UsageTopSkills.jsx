import { memo, useCallback, useMemo, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, Link, Typography, useTheme } from '@mui/material';

import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';

const MAX_ROWS = 5;

const UsageTopSkills = memo(props => {
  const { topSkills = [], canSeeAmounts, currency, analyticsUrl, sx = {} } = props;

  const { palette } = useTheme();
  const styles = usageTopSkillsStyles();

  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');

  const totalSpend = useMemo(() => topSkills.reduce((sum, s) => sum + (s.spend || 0), 0), [topSkills]);

  const enrichedSkills = useMemo(
    () =>
      topSkills.map((skill, idx) => {
        const key = skill.name || skill.id || String(idx);
        const uses = skill.uses ?? skill.call_count ?? null;
        const perUse = uses ? (skill.spend || 0) / uses : 0;

        return { ...skill, _key: key, _uses: uses, _perUse: perUse };
      }),
    [topSkills],
  );

  const sortedSkills = useMemo(() => {
    return [...enrichedSkills].sort((a, b) => {
      if (sortKey === 'name') {
        const aStr = (a.name || a.id || '').toLowerCase();
        const bStr = (b.name || b.id || '').toLowerCase();
        return sortDir === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
      }

      let av, bv;

      if (sortKey === 'uses') {
        av = a._uses ?? -Infinity;
        bv = b._uses ?? -Infinity;
      } else if (sortKey === 'perUse') {
        av = a._perUse;
        bv = b._perUse;
      } else {
        av = a.spend || 0;
        bv = b.spend || 0;
      }

      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [enrichedSkills, sortKey, sortDir]);

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

  const SortHeader = useCallback(
    ({ label, keyName, flex }) => {
      const isActive = sortKey === keyName;

      return (
        <Box
          sx={[styles.sortableCell, { flex }]}
          onClick={() => handleSort(keyName)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleSort(keyName)}
        >
          <Typography sx={[styles.cellText, isActive ? { color: palette.primary.main } : {}]}>
            {label}
            {isActive && <Box component="span">{sortDir === 'desc' ? ' ▼' : ' ▲'}</Box>}
          </Typography>
        </Box>
      );
    },
    [sortKey, sortDir, handleSort, palette, styles],
  );

  if (!topSkills.length) return null;

  const visibleSkills = sortedSkills.slice(0, MAX_ROWS);

  return (
    <Box
      sx={[styles.card, sx]}
      data-testid="usage-top-skills"
    >
      <Box sx={styles.titleRow}>
        <Typography
          variant="labelMedium"
          sx={styles.title}
        >
          Top skills
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
            sx={[styles.sortableCell, { flex: 3, justifyContent: 'flex-start', textAlign: 'left' }]}
            onClick={() => handleSort('name')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleSort('name')}
          >
            <Typography sx={[styles.cellText, sortKey === 'name' ? { color: palette.primary.main } : {}]}>
              Skill
              {sortKey === 'name' && <Box component="span">{sortDir === 'desc' ? ' ▼' : ' ▲'}</Box>}
            </Typography>
          </Box>
          <SortHeader
            label="Uses"
            keyName="uses"
            flex={1}
          />
          <SortHeader
            label="Per use"
            keyName="perUse"
            flex={1.2}
          />
          <SortHeader
            label={canSeeAmounts ? 'Spend' : 'Share'}
            keyName="spend"
            flex={1.2}
          />
        </Box>

        {visibleSkills.map(skill => {
          const share = totalSpend > 0 ? ((skill.spend || 0) / totalSpend) * 100 : 0;

          return (
            <Box
              key={skill._key}
              sx={styles.row}
            >
              <Box sx={{ flex: 3, minWidth: 0 }}>
                <Typography sx={styles.name}>{skill.name || skill.id}</Typography>
              </Box>
              <Typography sx={[styles.value, styles.right, { flex: 1 }]}>{skill._uses ?? '—'}</Typography>
              <Typography
                sx={[
                  styles.value,
                  styles.right,
                  { flex: 1.2, color: palette.text.metrics || palette.text.disabled },
                ]}
              >
                {canSeeAmounts && skill._uses ? UsageHelpers.formatMoney(skill._perUse, currency) : '—'}
              </Typography>
              <Typography sx={[styles.value, styles.right, { flex: 1.2 }]}>
                {canSeeAmounts ? UsageHelpers.formatMoney(skill.spend, currency) : `${share.toFixed(1)}%`}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

UsageTopSkills.displayName = 'UsageTopSkills';

/** @type {MuiSx} */
const usageTopSkillsStyles = () => ({
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
  sortableCell: {
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    textAlign: 'right',
  },
  cellText: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: palette.text.metrics || palette.text.disabled,
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

export default UsageTopSkills;
