import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { ChatHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { SubAgentSection } from '@/[fsd]/features/chat/ui/sub-agent-section';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { StyledAccordion, StyledAccordionDetails, StyledAccordionSummary } from '@/[fsd]/shared/ui/accordion';
import ArrowRightIcon from '@/assets/arrow-right-icon.svg?react';
import { TOOL_ACTION_NAMES, TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';

import ActionView from './ActionView';

const ApplicationThinkView = memo(props => {
  const { defaultExpanded = false, actions, originalActions, isStreaming = false, tools } = props;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [displayedActionIndex, setDisplayedActionIndex] = useState(0);
  const displayTimerId = useRef(-1);

  const styles = applicationThinkViewStyles();

  const finishedActions = useMemo(
    () => actions.slice(0, displayedActionIndex),
    [actions, displayedActionIndex],
  );
  // Check by type only - streaming uses actual tool names, history uses constants
  const isReasoningAction = useCallback(
    action =>
      action.type === TOOL_ACTION_TYPES.Llm ||
      action.type === TOOL_ACTION_TYPES.Toolkit ||
      action.type === TOOL_ACTION_TYPES.Summary,
    [],
  );

  // SwarmChild actions should be shown separately with full content
  const isSwarmChildAction = useCallback(action => action.type === TOOL_ACTION_TYPES.SwarmChild, []);

  // Meta-tools that should be hidden when followed by actual tool calls
  const isMetaTool = useCallback(
    action => action.name?.includes('invoke_tool') || action.name?.includes('list_toolkits'),
    [],
  );

  // Helper to group actions into "turns" - each turn has optional reasoning text followed by tool badges
  // Also extracts SwarmChild actions to render separately with full content
  const groupActions = useCallback(
    actionsList => {
      const groups = [];
      const swarmChildren = []; // Separate list for swarm child actions
      let currentGroup = { reasoning: null, tools: [] };
      // Track ALL seen LLM node names and their actions to merge duplicates
      // (pipeline may call same node multiple times with tool calls in between)
      const seenLlmActions = new Map(); // normalizedName -> action reference in groups

      actionsList.forEach(action => {
        // Extract SwarmChild actions to render separately with full content
        if (isSwarmChildAction(action)) {
          swarmChildren.push(action);
          return;
        }
        if (isReasoningAction(action)) {
          // Skip ALL LLM actions with empty content AND empty thinking (transition steps)
          // Named LLM actions (Start, Chat) with actual content or thinking should still show their chips
          const hasContent =
            (action.content && action.content.trim()) || (action.thinking && action.thinking.trim());
          if (!hasContent && action.type === TOOL_ACTION_TYPES.Llm) {
            return; // Skip empty LLM actions (transition steps)
          }
          // Skip LLM actions without a proper node name (transition actions before name is set)
          // These show as just model name without ": NodeName" suffix
          // Also skip actions with default "Thinking step" name - these are transition markers
          if (
            action.type === TOOL_ACTION_TYPES.Llm &&
            (!action.name || action.name === TOOL_ACTION_NAMES.Llm)
          ) {
            return; // Skip nameless/default transition actions
          }
          // Merge duplicate LLM actions with same name (pipeline calling same node multiple times)
          // Normalize name for comparison (trim whitespace, case-insensitive)
          const normalizedName = action.name?.trim().toLowerCase();
          if (action.type === TOOL_ACTION_TYPES.Llm && seenLlmActions.has(normalizedName)) {
            const existingAction = seenLlmActions.get(normalizedName);
            // DON'T merge if existing action is already complete - it's from a previous execution
            // (e.g., parent agent completed, now sub-agent with same node name is running)
            const existingIsComplete =
              existingAction.status === ToolActionStatus.complete && existingAction.ended_at;
            if (!existingIsComplete) {
              // Merge content into existing action (same execution, continuous updates)
              if (action.content && action.content.trim()) {
                const separator = existingAction.content ? '\n\n---\n\n' : '';
                existingAction.content = (existingAction.content || '') + separator + action.content;
              }
              if (action.thinking && action.thinking.trim()) {
                const separator = existingAction.thinking ? '\n\n---\n\n' : '';
                existingAction.thinking = (existingAction.thinking || '') + separator + action.thinking;
              }
              // Update end timestamp to latest
              if (action.ended_at) {
                existingAction.ended_at = action.ended_at;
              }
              return; // Don't create new chip, content merged into existing
            }
            // If existing is complete, fall through to create new action (different execution)
          }
          if (currentGroup.tools.length > 0 || currentGroup.reasoning) {
            groups.push(currentGroup);
          }
          currentGroup = { reasoning: action, tools: [] };
          if (action.type === TOOL_ACTION_TYPES.Llm && normalizedName) {
            seenLlmActions.set(normalizedName, action);
          }
        } else {
          currentGroup.tools.push(action);
        }
      });

      if (currentGroup.tools.length > 0 || currentGroup.reasoning) {
        groups.push(currentGroup);
      }

      // Filter out meta-tools (like invoke_tool) when actual tools are present in the same group
      const filteredGroups = groups.map(group => {
        if (group.tools.length > 1) {
          const hasRealTools = group.tools.some(t => !isMetaTool(t));
          if (hasRealTools) {
            return {
              ...group,
              tools: group.tools.filter(t => !isMetaTool(t)),
            };
          }
        }
        return group;
      });

      return { groups: filteredGroups, swarmChildren };
    },
    [isReasoningAction, isMetaTool, isSwarmChildAction],
  );

  // The sub-agent an action originated from — the same signal the chip's
  // parenthetical "(Agent Name)" uses (see ActionView.buildTitle). Falls back
  // across the field variants the different socket events populate:
  // AgentLlmStart/AgentToolStart set top-level parent_agent_name/original_name;
  // AgentLlmChunk (streaming) sets neither and only exposes the node name via
  // toolMeta.checkpoint_ns ("{AgentName}:{uuid}") — mirror getToolActionOriginalName.
  const deriveSubAgentName = useCallback(item => {
    if (!item) return '';
    const explicit = item.parent_agent_name || item.toolMeta?.parent_agent_name || item.original_name;
    if (explicit) return explicit;
    const ns = item.toolMeta?.checkpoint_ns;
    if (ns) {
      const name = ns.split(':')[0];
      if (name && name !== 'main_agent' && name !== 'agent') return name;
    }
    return '';
  }, []);

  // Partition the raw ACTIONS (not turn-groups) by originating sub-agent, then
  // group each partition independently. A single parallel-fan-out turn-group can
  // interleave tools from multiple sub-agents, so bucketing must happen at the
  // action level — otherwise one sub-agent's chips land under another's header
  // (issue #4993). Coordinator actions (no sub-agent key) group first/ungrouped.
  const partitionBySubAgent = useCallback(
    actionsList => {
      const coordinator = [];
      const order = [];
      const byName = new Map();
      actionsList.forEach(action => {
        const key = deriveSubAgentName(action);
        if (!key) {
          coordinator.push(action);
          return;
        }
        if (!byName.has(key)) {
          byName.set(key, []);
          order.push(key);
        }
        byName.get(key).push(action);
      });
      return {
        coordinatorGroups: groupActions(coordinator).groups,
        subAgents: order.map(name => ({ name, groups: groupActions(byName.get(name)).groups })),
      };
    },
    [deriveSubAgentName, groupActions],
  );

  // Revealed (finished) actions for streaming view; all actions for history view.
  const streamingPartition = useMemo(
    () => partitionBySubAgent(finishedActions),
    [partitionBySubAgent, finishedActions],
  );
  const historyPartition = useMemo(() => partitionBySubAgent(actions), [partitionBySubAgent, actions]);

  // In-flight streaming LLM action per sub-agent → drives the parallel content
  // boxes (one per sub-agent, each ~5 lines). Keyed by sub-agent so two children
  // streaming the same node name don't bleed content into one box (issue #4993).
  const subAgentInflight = useMemo(() => {
    const map = new Map();
    actions.forEach(a => {
      if (!a || a.type !== TOOL_ACTION_TYPES.Llm) return;
      const key = deriveSubAgentName(a);
      if (!key) return;
      const active =
        a.status !== ToolActionStatus.complete &&
        a.status !== ToolActionStatus.error &&
        a.status !== ToolActionStatus.cancelled;
      const hasContent = (a.content && a.content.trim()) || (a.thinking && a.thinking.trim());
      if (!active || !hasContent) return;
      if (!a.name || a.name === TOOL_ACTION_NAMES.Llm) return;
      map.set(key, a); // latest active action per sub-agent wins
    });
    return map;
  }, [actions, deriveSubAgentName]);

  const thinkStepStatus = useMemo(
    () =>
      actions.map(action => ({
        status: action?.status,
        content: action?.content,
        toolOutputs: action?.toolOutputs,
      })),
    [actions],
  );

  const currentStepStatus = useMemo(
    () => thinkStepStatus[displayedActionIndex]?.status,
    [thinkStepStatus, displayedActionIndex],
  );

  const thoughtDuration = useMemo(() => {
    const startTime = originalActions[0]?.created_at || originalActions[0]?.timestamp;
    const endTime =
      originalActions[originalActions.length - 1]?.timestamp ||
      originalActions[originalActions.length - 1]?.ended_at ||
      originalActions[originalActions.length - 1]?.created_at;
    return ChatHelpers.calculateDuration(startTime, endTime);
  }, [originalActions]);

  useEffect(() => {
    // Find the highest index of actions that are complete or have content/thinking
    let maxValidIndex = 0;
    for (let i = 0; i < actions.length; i++) {
      if (
        actions[i] &&
        (actions[i].status === ToolActionStatus.complete ||
          actions[i].status === ToolActionStatus.error ||
          actions[i].status === ToolActionStatus.cancelled ||
          actions[i].content ||
          actions[i].thinking ||
          actions[i].toolOutputs)
      ) {
        maxValidIndex = i;
      }
    }

    if (maxValidIndex > displayedActionIndex) {
      if (displayTimerId.current !== -1) {
        clearTimeout(displayTimerId.current);
        displayTimerId.current = -1;
      }
      setDisplayedActionIndex(maxValidIndex);
    }
  }, [actions, thinkStepStatus, displayedActionIndex]);

  useEffect(() => {
    if (
      currentStepStatus === ToolActionStatus.complete ||
      currentStepStatus === ToolActionStatus.error ||
      currentStepStatus === ToolActionStatus.cancelled
    ) {
      if (displayTimerId.current !== -1) {
        clearTimeout(displayTimerId.current);
        displayTimerId.current = -1;
      }

      const prevIndex = displayedActionIndex;
      displayTimerId.current = setTimeout(() => {
        // Allow advancing to actions.length to hide the last expanded action
        if (prevIndex + 1 <= actions.length && displayedActionIndex === prevIndex) {
          setDisplayedActionIndex(prevIndex + 1);
        }
        displayTimerId.current = -1;
      }, 2000);
    }
  }, [actions.length, currentStepStatus, displayedActionIndex]);

  const onExpanded = useCallback((_, value) => {
    setExpanded(value);
  }, []);

  // For streaming: collect content from finished actions with same name as current action
  // BUT only from the SAME execution context (not from completed parent agent runs)
  const mergedCurrentAction = useMemo(() => {
    const currentAction = actions[displayedActionIndex];
    if (!currentAction || currentAction.type !== TOOL_ACTION_TYPES.Llm) {
      return currentAction;
    }

    const currentName = currentAction.name?.trim().toLowerCase();
    if (!currentName || currentName === TOOL_ACTION_NAMES.Llm?.toLowerCase()) {
      return currentAction;
    }

    // Find finished LLM actions with the same name that are NOT from a completed previous execution
    // A completed previous execution has status='complete' and ended_at set BEFORE current action started
    const currentStartTime = currentAction.created_at || currentAction.timestamp;
    const currentKey = deriveSubAgentName(currentAction);
    const sameNameFinished = finishedActions.filter(a => {
      if (a.type !== TOOL_ACTION_TYPES.Llm) return false;
      if (a.name?.trim().toLowerCase() !== currentName) return false;
      // Only merge within the SAME sub-agent — two children sharing a node name
      // must not pool their content into one box (issue #4993).
      if (deriveSubAgentName(a) !== currentKey) return false;
      // Skip if this finished action is from a different (earlier completed) execution
      // i.e., it completed before the current action started
      if (a.status === ToolActionStatus.complete && a.ended_at && currentStartTime) {
        const finishedEndTime = new Date(a.ended_at).getTime();
        const currentStart = new Date(currentStartTime).getTime();
        if (finishedEndTime < currentStart) {
          return false; // Different execution - skip
        }
      }
      return true;
    });

    if (sameNameFinished.length === 0) {
      return currentAction;
    }

    // Collect previous executions with their thinking and content
    const previousExecutions = sameNameFinished.map(f => ({
      thinking: f.thinking || '',
      content: f.content || '',
    }));

    return {
      ...currentAction,
      previousExecutions,
    };
  }, [actions, displayedActionIndex, finishedActions, deriveSubAgentName]);

  // Render the chips for one turn-group. Streaming keeps the "skip reasoning chip
  // when it's the same node as the in-flight action" behavior and shows tool
  // chips as toolkit-only; history shows full tool chips (click → modal).
  const renderGroupChips = useCallback(
    (group, keyPrefix, streaming, inflightAction) => {
      const items = [];
      let skipReasoning = false;
      if (streaming) {
        // Compare against the in-flight box this bucket renders (sub-agent box,
        // or the coordinator's mergedCurrentAction) so a reasoning chip isn't
        // shown twice — once as a chip and once as the live content box.
        const ref = inflightAction || actions[displayedActionIndex];
        const refIsLlm = ref?.type === TOOL_ACTION_TYPES.Llm;
        skipReasoning =
          refIsLlm && group.reasoning?.name?.trim().toLowerCase() === ref?.name?.trim().toLowerCase();
      }
      if (group.reasoning && !skipReasoning) {
        items.push(
          <ActionView
            key={`reasoning-${keyPrefix}`}
            action={group.reasoning}
            tools={tools}
            isStreaming={streaming}
            onlyShowToolkit
            width="auto"
          />,
        );
      }
      group.tools.forEach((action, toolIndex) => {
        items.push(
          <ActionView
            key={`${action.id}-${keyPrefix}-${toolIndex}`}
            action={action}
            tools={tools}
            isStreaming={streaming}
            onlyShowToolkit={streaming}
            width="auto"
          />,
        );
      });
      return items;
    },
    [actions, displayedActionIndex, tools],
  );

  // Whether the in-flight current action should render its progress/content box,
  // and which sub-agent (if any) it belongs to so it sits under that section.
  const showCurrentAction =
    !!mergedCurrentAction &&
    displayedActionIndex >= finishedActions.length &&
    !(
      mergedCurrentAction.type === TOOL_ACTION_TYPES.Llm &&
      (!mergedCurrentAction.name || mergedCurrentAction.name === TOOL_ACTION_NAMES.Llm)
    );
  const currentActionKey = showCurrentAction ? deriveSubAgentName(mergedCurrentAction) : '';

  const currentActionBox = showCurrentAction ? (
    <ActionView
      showProgress
      action={mergedCurrentAction}
      tools={tools}
      isStreaming
    />
  ) : null;

  return isStreaming ? (
    <Box sx={styles.streamingContainer}>
      {/* SwarmChild actions are NOT rendered here during streaming.
          They will be rendered as separate accordions in ApplicationAnswer
          after streaming completes (!isProcessing). */}
      {(() => {
        const { coordinatorGroups, subAgents } = streamingPartition;
        // Union: sub-agents with revealed chips + any with only an in-flight box
        // (and the coordinator's current action if it belongs to a sub-agent).
        const order = subAgents.map(s => s.name);
        const addName = name => {
          if (name && !order.includes(name)) order.push(name);
        };
        subAgentInflight.forEach((_, key) => addName(key));
        if (currentActionKey) addName(currentActionKey);
        const groupsByName = new Map(subAgents.map(s => [s.name, s.groups]));
        return (
          <>
            {coordinatorGroups.length > 0 && (
              <Box sx={styles.badgesContainer}>
                {coordinatorGroups.flatMap((group, i) => renderGroupChips(group, `coord-${i}`, true))}
              </Box>
            )}
            {currentActionKey === '' && currentActionBox}
            {order.map(name => {
              const groups = groupsByName.get(name) || [];
              const inflight = subAgentInflight.get(name);
              return (
                <Box
                  key={`sa-${name}`}
                  sx={styles.subAgentGroup}
                >
                  <SubAgentSection name={name} />
                  {groups.length > 0 && (
                    <Box sx={styles.badgesContainer}>
                      {groups.flatMap((group, i) => renderGroupChips(group, `${name}-${i}`, true, inflight))}
                    </Box>
                  )}
                  {inflight ? (
                    <ActionView
                      showProgress
                      action={inflight}
                      tools={tools}
                      isStreaming
                    />
                  ) : (
                    currentActionKey === name && currentActionBox
                  )}
                </Box>
              );
            })}
          </>
        );
      })()}
    </Box>
  ) : (
    <StyledAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onChange={onExpanded}
      sx={styles.accordion}
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <StyledAccordionSummary
        expandIcon={<ArrowRightIcon style={styles.expandIcon} />}
        aria-controls="panel-content"
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        sx={styles.accordionSummary}
      >
        <Box sx={styles.summaryContent}>
          <Typography
            variant="bodyMedium"
            sx={styles.summaryText}
          >
            {`Thought for ${thoughtDuration}`}
          </Typography>
        </Box>
      </StyledAccordionSummary>
      <StyledAccordionDetails sx={styles.accordionDetails}>
        {/* SwarmChild actions are NOT rendered here in history view.
            They are rendered as separate accordions in ApplicationAnswer. */}
        {(() => {
          const { coordinatorGroups, subAgents } = historyPartition;
          return (
            <>
              {coordinatorGroups.length > 0 && (
                <Box sx={styles.badgesContainer}>
                  {coordinatorGroups.flatMap((group, i) => renderGroupChips(group, `coord-${i}`, false))}
                </Box>
              )}
              {subAgents.map(bucket => (
                <Box
                  key={`sa-${bucket.name}`}
                  sx={styles.subAgentGroup}
                >
                  <SubAgentSection name={bucket.name} />
                  <Box sx={styles.badgesContainer}>
                    {bucket.groups.flatMap((group, i) =>
                      renderGroupChips(group, `${bucket.name}-${i}`, false),
                    )}
                  </Box>
                </Box>
              ))}
            </>
          );
        })()}
      </StyledAccordionDetails>
    </StyledAccordion>
  );
});

ApplicationThinkView.displayName = 'ApplicationThinkView';

/** @type {MuiSx} */
const applicationThinkViewStyles = () => ({
  streamingContainer: {
    width: '100%',
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  turnContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  badgesContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  subAgentGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  accordion: ({ palette }) => ({
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    '&.Mui-expanded': {
      margin: '0rem 0',
    },
    width: '100%',
    '& .MuiAccordion-heading': {
      display: 'inline-block',
      paddingBottom: '0.25rem !important',
    },
    paddingBottom: '0.5rem !important',
  }),
  accordionSummary: ({ palette, typography }) => ({
    width: 'auto !important',
    borderRadius: '1rem',
    minHeight: '1.5rem !important',
    alignItem: 'center',
    padding: '0rem 0.5rem !important',
    '&:hover': {
      backgroundColor: palette.background.userInputBackgroundActive,
      color: palette.icon.fill.secondary,
      '& .MuiAccordionSummary-content': {
        '& span': {
          color: palette.text.secondary,
        },
      },
      '& .MuiAccordionSummary-expandIconWrapper': {
        color: palette.icon.fill.secondary,
      },
    },
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
      marginLeft: '0.5rem !important',
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
      color: palette.icon.fill.default,
    },
    '& .MuiTypography-root': {
      fontFamily: `${typography.fontFamily} !important`,
    },
  }),
  expandIcon: {
    width: '1rem',
    height: '1rem',
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.75rem',
  },
  summaryText: ({ palette }) => ({
    color: palette.text.primary,
    '&:hover': {
      color: palette.text.secondary,
    },
  }),
  accordionDetails: {
    paddingBottom: '1rem',
    paddingLeft: '2rem',
    paddingRight: '0.75rem',
    paddingTop: '0.75rem',
    gap: '1rem',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
});

export default ApplicationThinkView;
