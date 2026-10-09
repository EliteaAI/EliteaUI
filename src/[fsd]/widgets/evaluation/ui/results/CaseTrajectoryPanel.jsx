import { memo, useMemo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Accordion } from '@/[fsd]/shared/ui';

import { useEvalCaseExecutionsQuery } from '../../api';
import {
  buildCaseUsageRows,
  compareTrajectoryNames,
  formatCaseContent,
  getCasePauseDetails,
  getTrajectoryMetricItems,
  getTrajectoryStateMessage,
  getTrajectoryStepMeta,
  getTrajectoryStepSections,
  getTrajectoryStepTitle,
  isGuardrailStep,
  recordedToolNames,
} from '../../lib/helpers';

const USAGE_COLUMNS = [
  { key: 'label', label: 'Role' },
  { key: 'inputTokens', label: 'Input tokens' },
  { key: 'outputTokens', label: 'Output tokens' },
  { key: 'totalTokens', label: 'Total tokens' },
  { key: 'cost', label: 'Cost' },
];

/**
 * What the agent did on one case of an offline-batch run (#6809 P1): what the agent and the judge
 * spent on it (#6716), the run counters and the ordered LLM and tool steps. Steps a sub-agent ran are indented under the call that started them.
 * When the case carries an `expected_trajectory` (#6809 item 7), the expected calls are set beside the recorded ones.
 */
const CaseTrajectoryPanel = memo(props => {
  const { projectId, runId, datasetCaseId, expectedTrajectory } = props;

  const { data, isFetching, isError } = useEvalCaseExecutionsQuery(
    { projectId, runId, datasetCaseId },
    { skip: !projectId || !runId || datasetCaseId == null },
  );

  const execution = data?.executions?.[0] ?? null;
  const steps = execution?.trajectory?.steps ?? [];
  const metricItems = useMemo(() => getTrajectoryMetricItems(execution?.metrics), [execution?.metrics]);
  const usageRows = useMemo(() => buildCaseUsageRows(data?.usage), [data?.usage]);
  const stateMessage = getTrajectoryStateMessage(execution);
  const pauseDetails = useMemo(() => getCasePauseDetails(execution), [execution]);
  const comparison = useMemo(
    () =>
      execution?.trajectory
        ? compareTrajectoryNames(expectedTrajectory, recordedToolNames(execution.trajectory))
        : null,
    [expectedTrajectory, execution?.trajectory],
  );
  const styles = caseTrajectoryPanelStyles();

  if (isFetching && !data) {
    return (
      <Box sx={styles.centered}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (isError) {
    return (
      <Box sx={styles.centered}>
        <Typography variant="bodySmall">Could not load the trajectory for this case.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={styles.container}
      data-testid="case-trajectory-panel"
    >
      {usageRows.length > 0 && (
        <Box
          sx={styles.usageTable}
          data-testid="case-usage"
        >
          {USAGE_COLUMNS.map(({ key, label }) => (
            <Typography
              key={key}
              variant="labelSmall"
              sx={styles.metricLabel}
            >
              {label}
            </Typography>
          ))}
          {usageRows.map(row => (
            <Box
              key={row.role}
              sx={styles.usageRow}
              data-testid={`case-usage-${row.role}`}
            >
              {USAGE_COLUMNS.map(({ key }) => (
                <Typography
                  key={key}
                  variant="bodySmall"
                  sx={key === 'cost' && row.isUnpriced ? styles.emptyText : undefined}
                >
                  {row[key]}
                </Typography>
              ))}
              {row.note && (
                <Typography
                  variant="bodySmall"
                  sx={[styles.usageNote, !row.isRecorded && styles.emptyText]}
                >
                  {row.note}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {metricItems.length > 0 && (
        <Box sx={styles.metrics}>
          {metricItems.map(({ label, value }) => (
            <Box
              key={label}
              sx={styles.metric}
            >
              <Typography
                variant="labelSmall"
                sx={styles.metricLabel}
              >
                {label}
              </Typography>
              <Typography variant="bodySmall">{value}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {pauseDetails && <PauseDetails details={pauseDetails} />}

      {comparison && <ExpectedVsActual comparison={comparison} />}

      {stateMessage ? (
        <Typography
          variant="bodySmall"
          sx={styles.emptyText}
        >
          {stateMessage}
        </Typography>
      ) : steps.length === 0 ? (
        <Typography
          variant="bodySmall"
          sx={styles.emptyText}
        >
          The agent answered without calling the model or any tools.
        </Typography>
      ) : (
        <Box sx={styles.steps}>
          {execution?.trajectory?.truncated && (
            <Typography
              variant="bodySmall"
              sx={styles.emptyText}
            >
              This trajectory was shortened to fit the storage limit; late payloads may be missing.
            </Typography>
          )}
          {steps.map(step => (
            <Accordion.BasicAccordion
              key={step.i}
              defaultExpanded={false}
              uppercase={false}
              style={step.parent_agent ? styles.childStep : undefined}
              data-testid={`trajectory-step-${step.i}`}
              items={[
                {
                  title: getTrajectoryStepTitle(step),
                  headerContent: (
                    <Typography
                      variant="bodySmall"
                      sx={[
                        styles.stepMeta,
                        step.status === 'error' && styles.stepError,
                        isGuardrailStep(step) && styles.stepWarning,
                      ]}
                    >
                      {[step.parent_agent && `in ${step.parent_agent}`, getTrajectoryStepMeta(step)]
                        .filter(Boolean)
                        .join(' · ')}
                    </Typography>
                  ),
                  content: <StepSections step={step} />,
                },
              ]}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

CaseTrajectoryPanel.displayName = 'CaseTrajectoryPanel';

const StepSections = memo(({ step }) => {
  const sections = getTrajectoryStepSections(step);
  const styles = caseTrajectoryPanelStyles();
  if (!sections.length) {
    return (
      <Typography
        variant="bodySmall"
        sx={styles.emptyText}
      >
        No payload recorded for this step.
      </Typography>
    );
  }
  return sections.map(({ label, content }) => (
    <Box
      key={label}
      sx={styles.section}
    >
      <Typography
        variant="labelSmall"
        sx={styles.metricLabel}
      >
        {label}
      </Typography>
      <Typography
        variant="bodySmall"
        component="pre"
        sx={styles.pre}
      >
        {formatCaseContent(content)}
      </Typography>
    </Box>
  ));
});

StepSections.displayName = 'StepSections';

// Why the run stopped on this case (#6809 item 2): identities only, the paused call's args are not stored.
const PauseDetails = memo(({ details }) => {
  const styles = caseTrajectoryPanelStyles();
  return (
    <Box
      sx={[styles.expected, styles.pause]}
      data-testid="case-pause-details"
    >
      <Typography
        variant="labelSmall"
        sx={styles.metricLabel}
      >
        {details.title}
      </Typography>
      {details.items.length > 0 && (
        <Box sx={styles.metrics}>
          {details.items.map(({ label, value }) => (
            <Box
              key={label}
              sx={styles.metric}
            >
              <Typography
                variant="labelSmall"
                sx={styles.stepMeta}
              >
                {label}
              </Typography>
              <Typography variant="bodySmall">{value}</Typography>
            </Box>
          ))}
        </Box>
      )}
      <Typography
        variant="bodySmall"
        sx={styles.stepMeta}
      >
        {details.note}
      </Typography>
    </Box>
  );
});

PauseDetails.displayName = 'PauseDetails';

// By name only: the `trajectory.tool_match` dimension owns the score, args and match-mode rules.
const ExpectedVsActual = memo(({ comparison }) => {
  const styles = caseTrajectoryPanelStyles();
  const line = (key, ok, text) => (
    <Typography
      key={key}
      variant="bodySmall"
      sx={ok ? undefined : styles.stepError}
      data-testid={key}
    >
      {ok ? '✓' : '✗'} {text}
    </Typography>
  );
  return (
    <Box
      sx={styles.expected}
      data-testid="case-expected-trajectory"
    >
      <Typography
        variant="labelSmall"
        sx={styles.metricLabel}
      >
        Expected vs actual ({comparison.match})
      </Typography>
      {comparison.tools.length === 0 && (
        <Typography
          variant="bodySmall"
          sx={styles.stepMeta}
        >
          No expected tool calls.
        </Typography>
      )}
      {comparison.tools.map((tool, index) =>
        line(
          `expected-tool-${index}`,
          tool.called,
          `${tool.name}${tool.hasArgs ? ' (with args)' : ''}: ${tool.called ? 'called' : 'not called'}`,
        ),
      )}
      {comparison.forbidden.map(tool =>
        line(
          `forbidden-tool-${tool.name}`,
          !tool.called,
          `${tool.name} is forbidden: ${tool.called ? 'called' : 'not called'}`,
        ),
      )}
      {comparison.budget &&
        line(
          'expected-budget',
          comparison.budget.ok,
          `${comparison.budget.used} of at most ${comparison.budget.max} tool calls`,
        )}
      {comparison.extra.length > 0 && (
        <Typography
          variant="bodySmall"
          sx={styles.stepMeta}
          data-testid="expected-extra-tools"
        >
          Also called: {comparison.extra.join(', ')}
        </Typography>
      )}
      <Typography
        variant="bodySmall"
        sx={styles.stepMeta}
      >
        Matched by tool name; the trajectory dimensions apply the match mode and arguments.
      </Typography>
    </Box>
  );
});

ExpectedVsActual.displayName = 'ExpectedVsActual';

/** @type {MuiSx} */
const caseTrajectoryPanelStyles = () => ({
  container: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '0.75rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  centered: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageTable: {
    display: 'grid',
    gridTemplateColumns: 'minmax(4rem, 1fr) repeat(4, minmax(0, 1fr))',
    columnGap: '1rem',
    rowGap: '0.25rem',
  },
  usageRow: {
    display: 'contents',
  },
  usageNote: ({ palette }) => ({
    gridColumn: '1 / -1',
    color: palette.text.secondary,
  }),
  metrics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem 1.5rem',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }),
  expected: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
  }),
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  childStep: ({ palette }) => ({
    marginLeft: '1.5rem',
    borderLeft: `0.125rem solid ${palette.border.lines}`,
    paddingLeft: '0.5rem',
  }),
  stepMeta: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  stepError: ({ palette }) => ({
    color: palette.error.main,
  }),
  stepWarning: ({ palette }) => ({
    color: palette.warning.main,
  }),
  pause: ({ palette }) => ({
    borderColor: palette.warning.main,
  }),
  section: {
    marginBottom: '0.75rem',
  },
  pre: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  }),
  emptyText: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
});

export default CaseTrajectoryPanel;
