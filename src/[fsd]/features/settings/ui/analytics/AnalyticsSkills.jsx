import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import {
  Bar,
  BarChart,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import { Box, CircularProgress, TablePagination, TableSortLabel, Typography, useTheme } from '@mui/material';

import { useAnalyticsSkillsQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers, AnalyticsExportHelpers } from '@/[fsd]/features/settings/lib/helpers';
import {
  AnalyticsSkillDetailed,
  ChartTooltip,
  DeletedChip,
  KPICard,
  SkillsEmptyState,
} from '@/[fsd]/features/settings/ui/analytics';
import { analyticsTableStyles } from '@/[fsd]/features/settings/ui/analytics/components/analyticsTable.styles';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';
import StyledSearchInput from '@/components/SearchInput';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const CHART_SIZE = 20;
const DEFAULT_SORT = { sortBy: 'runs', sortOrder: 'desc' };

const SKILL_COLUMNS = [
  { key: 'skill_name', label: 'Skill', flex: 3 },
  { key: 'runs', label: 'Runs', render: r => AnalyticCommonHelpers.fmtNum(r.runs) },
  {
    key: 'in_agent_uses',
    label: 'In-Agent Uses',
    render: r => AnalyticCommonHelpers.fmtNum(r.in_agent_uses),
  },
  { key: 'users', label: 'Users', teamOnly: true, render: r => AnalyticCommonHelpers.fmtNum(r.users) },
  { key: 'agents_using', label: 'Agents Using', render: r => AnalyticCommonHelpers.fmtNum(r.agents_using) },
  {
    key: 'avg_duration_ms',
    label: 'Avg Latency',
    render: r => AnalyticCommonHelpers.fmtDuration(r.avg_duration_ms),
  },
  { key: 'errors', label: 'Errors', render: r => r.errors },
  { key: 'total_tokens', label: 'Tokens', render: r => AnalyticCommonHelpers.fmtNum(r.total_tokens) },
  { key: 'cost', label: 'Cost', render: r => AnalyticCommonHelpers.fmtCost(r.cost) },
  {
    key: 'last_used',
    label: 'Last Used',
    flex: 1.5,
    render: r => AnalyticsExportHelpers.fmtRunDateTime(r.last_used),
  },
];

const AnalyticsSkills = memo(props => {
  const { projectId, dateFrom, dateTo } = props;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [selectedSkill, setSelectedSkill] = useState(null);

  const styles = analyticsSkillsStyles();
  const { palette } = useTheme();
  const axisStroke = palette.text.primary;
  const axisTickStyle = { fill: axisStroke, fontSize: 11 };

  const selectedProjectId = useSelectedProjectId();
  const personalProjectId = useSelector(state => state.user?.personal_project_id);
  const isPersonalProject =
    Boolean(personalProjectId) && String(selectedProjectId) === String(personalProjectId);
  const columns = useMemo(
    () => SKILL_COLUMNS.filter(column => !column.teamOnly || !isPersonalProject),
    [isPersonalProject],
  );

  const { data, isFetching, isError } = useAnalyticsSkillsQuery(
    {
      projectId,
      dateFrom,
      dateTo,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    },
    { skip: !projectId },
  );

  const { total = 0, rows = [], summary = {} } = data || {};

  const chartData = useMemo(
    () =>
      rows.slice(0, CHART_SIZE).map(r => ({
        name: r.skill_name,
        runs: r.runs,
        uses: r.in_agent_uses,
      })),
    [rows],
  );

  const handleSearchChange = useCallback(event => {
    setSearch(event.target.value);
    setPage(0);
  }, []);

  const handleSort = useCallback(key => {
    setSort(previous => ({
      sortBy: key,
      sortOrder: previous.sortBy === key && previous.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
    setPage(0);
  }, []);

  const handlePageChange = useCallback((_, newPage) => setPage(newPage), []);

  const handleRowsPerPageChange = useCallback(event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleBack = useCallback(() => setSelectedSkill(null), []);

  if (selectedSkill) {
    return (
      <AnalyticsSkillDetailed
        projectId={projectId}
        skillId={selectedSkill.skill_id}
        skillProjectId={selectedSkill.skill_project_id}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onBack={handleBack}
      />
    );
  }

  const tt = AnalyticsCommonConstants.TOOLTIP_TEXTS.skills;
  const hasUsage = Boolean(summary.skills_used);
  const showsTable = hasUsage || Boolean(search) || isError;
  const showsRows = !isFetching && !isError;

  return (
    <Box sx={styles.content}>
      {!isError && (
        <Box sx={styles.kpiRow}>
          <KPICard
            label="SKILL RUNS"
            value={AnalyticCommonHelpers.fmtNum(summary.runs)}
            tooltip={tt.RUNS}
            testId="analytics-skills-kpi-runs"
            valueTestId="analytics-skills-kpi-runs-value"
          />
          <KPICard
            label="SKILLS USED"
            value={AnalyticCommonHelpers.fmtNum(summary.skills_used)}
            tooltip={tt.SKILLS_USED}
            testId="analytics-skills-kpi-skills-used"
            valueTestId="analytics-skills-kpi-skills-used-value"
          />
          <KPICard
            label="IN-AGENT USES"
            value={AnalyticCommonHelpers.fmtNum(summary.in_agent_uses)}
            tooltip={tt.IN_AGENT_USES}
            testId="analytics-skills-kpi-in-agent-uses"
            valueTestId="analytics-skills-kpi-in-agent-uses-value"
          />
          <KPICard
            label="SKILL RUN COST"
            value={AnalyticCommonHelpers.fmtCost(summary.cost)}
            subtitle="estimated"
            tooltip={tt.COST}
            testId="analytics-skills-kpi-cost"
            valueTestId="analytics-skills-kpi-cost-value"
          />
        </Box>
      )}

      {isFetching && !showsTable && (
        <Box
          sx={styles.loadingState}
          data-testid="analytics-skills-loading-indicator"
        >
          <CircularProgress size={24} />
        </Box>
      )}
      {!isFetching && !showsTable && <SkillsEmptyState />}

      {!isError && chartData.length > 0 && (
        <Box sx={analyticsTableStyles.chartCard}>
          <Typography
            variant="labelMedium"
            sx={analyticsTableStyles.chartTitle}
          >
            Most Used Skills
          </Typography>
          <Box sx={analyticsTableStyles.subtitleRow}>
            <Typography
              variant="bodySmall"
              sx={analyticsTableStyles.chartSubtitle}
            >
              Runs and in-agent uses on this page
            </Typography>
            <InfoTooltip infoTooltip={{ title: tt.MOST_USED, icon: { width: 12, height: 12 } }} />
          </Box>
          <Box
            sx={styles.chartWrapper}
            data-testid="analytics-skills-chart-container"
          >
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <BarChart
                data={chartData}
                margin={{ left: 5, right: 20, top: 5, bottom: 40 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ ...axisTickStyle, fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={50}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={axisTickStyle}
                  axisLine={{ stroke: axisStroke }}
                  tickLine={{ stroke: axisStroke }}
                />
                <RechartsTooltip
                  cursor={AnalyticCommonHelpers.barChartCursor(palette)}
                  content={<ChartTooltip />}
                />
                <Legend
                  formatter={value => (
                    <Typography
                      variant="bodySmall"
                      sx={styles.legendLabel}
                    >
                      {value}
                    </Typography>
                  )}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="runs"
                  name="Runs"
                  stackId="usage"
                  fill={palette.status.draft}
                />
                <Bar
                  dataKey="uses"
                  name="In-agent uses"
                  stackId="usage"
                  fill={palette.text.accent}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      )}

      {showsTable && (
        <Box sx={analyticsTableStyles.chartCard}>
          <Box sx={styles.tableHeaderRow}>
            <Box>
              <Typography
                variant="labelMedium"
                sx={analyticsTableStyles.chartTitle}
              >
                Skill Activity
              </Typography>
              <Box sx={analyticsTableStyles.subtitleRow}>
                <Typography
                  variant="bodySmall"
                  sx={analyticsTableStyles.chartSubtitle}
                  data-testid="analytics-skills-count"
                >
                  {total} skills
                </Typography>
                <InfoTooltip infoTooltip={{ title: tt.ACTIVITY_COUNT, icon: { width: 12, height: 12 } }} />
              </Box>
            </Box>
            <StyledSearchInput
              search={search}
              onChangeSearch={handleSearchChange}
              placeholder="Search by skill name"
              sx={styles.search}
              testId="analytics-skills-search-input"
            />
          </Box>
          <Box sx={analyticsTableStyles.tableWrapper}>
            <Box
              sx={analyticsTableStyles.tableHeader}
              data-testid="analytics-skills-table-header"
            >
              {columns.map(column => (
                <Box
                  key={column.key}
                  sx={[analyticsTableStyles.tableCell, { flex: column.flex ?? 1 }]}
                >
                  <TableSortLabel
                    active={sort.sortBy === column.key}
                    direction={sort.sortBy === column.key ? sort.sortOrder : 'desc'}
                    onClick={() => handleSort(column.key)}
                    sx={styles.sortLabel}
                    data-testid={`analytics-skills-sort-${column.key}`}
                  >
                    {column.label}
                  </TableSortLabel>
                </Box>
              ))}
            </Box>
            {isFetching && (
              <Box
                sx={styles.loadingState}
                data-testid="analytics-skills-loading-indicator"
              >
                <CircularProgress size={24} />
              </Box>
            )}
            {!isFetching && isError && (
              <Typography
                variant="bodySmall"
                sx={styles.noMatch}
                data-testid="analytics-skills-error"
              >
                Failed to load skill analytics.
              </Typography>
            )}
            {showsRows &&
              rows.map(skill => (
                <Box
                  key={`${skill.skill_project_id}:${skill.skill_id}`}
                  sx={styles.clickableRow}
                  onClick={() => setSelectedSkill(skill)}
                  data-testid="analytics-skills-row"
                >
                  {columns.map(column => (
                    <Box
                      key={column.key}
                      sx={[
                        analyticsTableStyles.tableCellValue,
                        { flex: column.flex ?? 1 },
                        column.key === 'errors' && skill.errors > 0 && styles.errorValue,
                      ]}
                      data-testid={`analytics-skills-row-${column.key}`}
                    >
                      {column.key === 'skill_name' ? (
                        <Box sx={styles.nameCell}>
                          <Typography
                            component="span"
                            sx={styles.name}
                            noWrap
                          >
                            {skill.skill_name}
                          </Typography>
                          {skill.deleted && <DeletedChip testId="analytics-skills-row-deleted" />}
                        </Box>
                      ) : (
                        column.render(skill)
                      )}
                    </Box>
                  ))}
                </Box>
              ))}
            {showsRows && !rows.length && (
              <Typography
                variant="bodySmall"
                sx={styles.noMatch}
                data-testid="analytics-skills-no-match"
              >
                No skills match the search.
              </Typography>
            )}
          </Box>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 20, 50]}
            sx={styles.pagination}
            slotProps={{
              select: { 'data-testid': 'analytics-skills-pagination-rows-select' },
              displayedRows: { 'data-testid': 'analytics-skills-pagination-range' },
              actions: {
                previousButton: { 'data-testid': 'analytics-skills-pagination-prev' },
                nextButton: { 'data-testid': 'analytics-skills-pagination-next' },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
});

AnalyticsSkills.displayName = 'AnalyticsSkills';

/** @type {MuiSx} */
const analyticsSkillsStyles = () => ({
  content: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' },
  chartWrapper: { width: '100%', overflow: 'hidden', flex: 1, minHeight: '12.5rem' },
  legendLabel: ({ palette }) => ({ color: palette.text.secondary }),
  tableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  search: {
    width: '15rem',
    height: '2.25rem',
    backgroundColor: ({ palette }) => palette.background.surface.interactive.default,
    borderRadius: '1.6875rem',
    gap: '.5rem',
    borderBottom: '0rem',
    padding: '0.375rem 0.75rem',
  },
  sortLabel: {
    color: 'inherit',
    '&.Mui-active': { color: 'inherit' },
    '& .MuiTableSortLabel-icon': { fontSize: '0.875rem' },
  },
  clickableRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
    cursor: 'pointer',
    '&:hover': { backgroundColor: palette.background.interactiveItem.rowHover },
  }),
  nameCell: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  name: ({ palette }) => ({ fontSize: '0.8125rem', color: palette.text.secondary, minWidth: 0 }),
  errorValue: ({ palette }) => ({ color: palette.status.rejected }),
  loadingState: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' },
  noMatch: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    padding: '1rem 0.75rem',
  }),
  pagination: ({ palette }) => ({
    color: palette.text.secondary,
    '& .MuiTablePagination-selectIcon': { color: palette.text.secondary },
  }),
});

export default AnalyticsSkills;
