import { memo, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Alert, Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material';

import { useProjectUsageQuery, useUsageMembersQuery } from '@/[fsd]/features/usage/api/usageApi';
import UsageDailyChart from '@/[fsd]/features/usage/ui/components/UsageDailyChart';
import UsageMembersTable from '@/[fsd]/features/usage/ui/components/UsageMembersTable';
import UsageModelTable from '@/[fsd]/features/usage/ui/components/UsageModelTable';
import UsageSummary from '@/[fsd]/features/usage/ui/components/UsageSummary';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const SCOPE_PROJECT = 'project';
const SCOPE_USER = 'user';

const UsageContainer = memo(() => {
  const styles = usageContainerStyles();
  const projectId = useSelectedProjectId();
  const personalProjectId = useSelector(state => state.user?.personal_project_id);

  const isPersonalProject = useMemo(
    () => Boolean(personalProjectId) && String(projectId) === String(personalProjectId),
    [projectId, personalProjectId],
  );

  // A personal project has a single member, so the project/my split is meaningless there
  const [scope, setScope] = useState(SCOPE_PROJECT);
  const activeScope = isPersonalProject ? SCOPE_PROJECT : scope;

  const { data, isLoading, isError } = useProjectUsageQuery(
    { projectId, scope: activeScope },
    { skip: !projectId, refetchOnMountOrArgChange: true },
  );

  // Members are admin-only; a 403 for regular members is expected, not an error to surface
  const { data: membersData } = useUsageMembersQuery(
    { projectId },
    { skip: !projectId || isPersonalProject },
  );

  if (isLoading) {
    return (
      <Box sx={styles.loading}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box sx={styles.content}>
        <Alert severity="error">Usage data is currently unavailable. Please try again later.</Alert>
      </Box>
    );
  }

  const canSeeAmounts = Boolean(data.can_see_amounts);
  const memberRows = membersData?.rows || [];

  return (
    <Box sx={styles.content}>
      {!isPersonalProject && (
        <Tabs
          value={scope}
          onChange={(event, value) => setScope(value)}
          sx={styles.tabs}
        >
          <Tab
            value={SCOPE_PROJECT}
            label="Whole project"
          />
          <Tab
            value={SCOPE_USER}
            label="My usage"
          />
        </Tabs>
      )}

      {!data.spend_available && (
        <Alert severity="info">
          Usage figures are still being collected for this period. They may lag live activity by a short time.
        </Alert>
      )}

      <UsageSummary
        data={data}
        scope={activeScope}
        isPersonalProject={isPersonalProject}
      />

      <Box sx={styles.row}>
        <UsageDailyChart
          daily={data.daily}
          canSeeAmounts={canSeeAmounts}
          currency={data.currency}
          periodStart={data.period_start}
          periodEnd={data.period_end}
        />
      </Box>

      <UsageModelTable
        models={data.models}
        canSeeAmounts={canSeeAmounts}
        currency={data.currency}
      />

      {activeScope === SCOPE_PROJECT && memberRows.length > 0 && <UsageMembersTable rows={memberRows} />}

      <Typography
        variant="bodySmall"
        sx={styles.footnote}
      >
        Only calls to platform-shared models count towards these budgets. Models you configure with your own
        credentials are billed by that provider and are not tracked here.
      </Typography>
    </Box>
  );
});

UsageContainer.displayName = 'UsageContainer';

/** @type {MuiSx} */
const usageContainerStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    overflowY: 'auto',
    height: '100%',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: '12rem',
  },
  tabs: ({ palette }) => ({
    minHeight: 'unset',
    borderBottom: `1px solid ${palette.border.lines}`,
    '& .MuiTab-root': {
      textTransform: 'none',
      fontSize: '0.8125rem',
      minHeight: '2.25rem',
    },
  }),
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  footnote: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
  }),
});

export default UsageContainer;
