import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { ChatHelpers } from '@/[fsd]/features/chat/lib/helpers';
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

  // Grouped finished actions (for streaming view)
  const { groups: groupedActions } = useMemo(
    () => groupActions(finishedActions),
    [groupActions, finishedActions],
  );

  // Grouped all actions (for accordion/history view)
  const { groups: groupedAllActions } = useMemo(() => groupActions(actions), [groupActions, actions]);

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
    const sameNameFinished = finishedActions.filter(a => {
      if (a.type !== TOOL_ACTION_TYPES.Llm) return false;
      if (a.name?.trim().toLowerCase() !== currentName) return false;
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
  }, [actions, displayedActionIndex, finishedActions]);

  return isStreaming ? (
    <Box sx={styles.streamingContainer}>
      {/* SwarmChild actions are NOT rendered here during streaming.
          They will be rendered as separate accordions in ApplicationAnswer
          after streaming completes (!isProcessing). */}
      {/* Show finished actions as chips */}
      {groupedActions.length > 0 && (
        <Box sx={styles.badgesContainer}>
          {groupedActions.flatMap((group, groupIndex) => {
            const items = [];
            // Add LLM reasoning chip - but skip if current action has same name (same node)
            const currentAction = actions[displayedActionIndex];
            const currentIsLlm = currentAction?.type === TOOL_ACTION_TYPES.Llm;
            const sameNodeAsCurrent =
              currentIsLlm &&
              group.reasoning?.name?.trim().toLowerCase() === currentAction?.name?.trim().toLowerCase();
            if (group.reasoning && !sameNodeAsCurrent) {
              items.push(
                <ActionView
                  key={`reasoning-${groupIndex}`}
                  action={group.reasoning}
                  tools={tools}
                  isStreaming
                  onlyShowToolkit
                  width="auto"
                />,
              );
            }
            // Add tool chips
            group.tools.forEach((action, toolIndex) => {
              items.push(
                <ActionView
                  key={`${action.id}-${toolIndex}`}
                  action={action}
                  tools={tools}
                  isStreaming
                  onlyShowToolkit
                  width="auto"
                />,
              );
            });
            return items;
          })}
        </Box>
      )}
      {/* Show current action with progress and expanded content */}
      {/* Skip nameless/default LLM actions (transition steps) */}
      {mergedCurrentAction &&
        displayedActionIndex >= finishedActions.length &&
        !(
          mergedCurrentAction.type === TOOL_ACTION_TYPES.Llm &&
          (!mergedCurrentAction.name || mergedCurrentAction.name === TOOL_ACTION_NAMES.Llm)
        ) && (
          <ActionView
            showProgress
            action={mergedCurrentAction}
            tools={tools}
            isStreaming
          />
        )}
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
        {/* In history view, show all chips as badges - click to view content in modal */}
        <Box sx={styles.badgesContainer}>
          {groupedAllActions.flatMap((group, groupIndex) => {
            const items = [];
            // Add LLM reasoning chip (click to view in modal)
            if (group.reasoning) {
              items.push(
                <ActionView
                  key={`reasoning-${groupIndex}`}
                  action={group.reasoning}
                  tools={tools}
                  isStreaming={false}
                  onlyShowToolkit
                  width="auto"
                />,
              );
            }
            // Add tool chips
            group.tools.forEach((action, toolIndex) => {
              items.push(
                <ActionView
                  key={`${action.id}-${groupIndex}-${toolIndex}`}
                  action={action}
                  tools={tools}
                  isStreaming={false}
                  width="auto"
                />,
              );
            });
            return items;
          })}
        </Box>
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
