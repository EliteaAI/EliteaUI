import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { ChatHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { ErrorTrace } from '@/[fsd]/features/chat/ui/error-trace';
import { SubAgentAccordion } from '@/[fsd]/features/chat/ui/sub-agent-section';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { StyledAccordion, StyledAccordionDetails, StyledAccordionSummary } from '@/[fsd]/shared/ui/accordion';
import ArrowRightIcon from '@/assets/arrow-right-icon.svg?react';
import { TOOL_ACTION_NAMES, TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';
import { getToolInfoFromAction } from '@/common/toolActionUitls';

import ActionView from './ActionView';

// Streaming view of the thinking block: ordered coordinator chip blocks and
// per-sub-agent accordions, plus any sub-agent whose activity the throttled
// reveal hasn't surfaced yet, plus the orchestrator's own in-flight box at the
// bottom. Extracted as a memoized component (rather than an inline IIFE) so it
// only re-renders when its inputs actually change.
const StreamingThinkBlocks = memo(props => {
  const {
    blocks,
    streamingSubGroupsFull,
    subAgentInflight,
    subAgentRunning,
    subAgentDone,
    currentActionKey,
    currentActionRunning,
    currentActionBox,
    subAgentErrors,
    messageId,
    onCopy,
    tools,
    renderGroupChips,
    badgesContainerSx,
  } = props;

  // Sub-agents already represented by a revealed block render their in-flight
  // box inline. Any sub-agent that ONLY has an in-flight box (no revealed
  // chips yet, so absent from blocks) is the newest activity → append after
  // the ordered blocks. The orchestrator's own in-flight box sits at the very
  // bottom (its natural chronological turn — bottom of the thinking block).
  const renderedSubNames = new Set(blocks.filter(b => b.kind === 'sub').map(b => b.name));
  const extraSub = [];
  const addExtra = name => {
    if (name && !renderedSubNames.has(name) && !extraSub.includes(name)) {
      extraSub.push(name);
    }
  };
  // Any sub-agent with arrived actions that the throttled reveal hasn't
  // surfaced yet still gets an accordion (its chips come from the full
  // groups below), so a running child is never missing from the view.
  streamingSubGroupsFull.forEach((_, key) => addExtra(key));
  subAgentInflight.forEach((_, key) => addExtra(key));
  if (subAgentRunning) subAgentRunning.forEach((_, key) => addExtra(key));
  if (currentActionKey) addExtra(currentActionKey);
  // A child that hard-failed before producing any revealed chip still needs an
  // accordion to host its error trace (#4993).
  if (subAgentErrors) Object.keys(subAgentErrors).forEach(name => addExtra(name));

  const renderSub = name => {
    // Chips from the FULL per-sub-agent groups (not the throttled window)
    // so every executed tool shows while the child is still running, with
    // full tool names (matching history) rather than toolkit-only chips.
    const subEntry = streamingSubGroupsFull.get(name);
    const groups = subEntry?.groups || [];
    const inflight = subAgentInflight.get(name);
    const childError = subAgentErrors?.[name];
    // `done` = the child returned to its parent (invocation wrapper terminal).
    // Once done, NOTHING about the child should still animate, even if a stray
    // inner LLM action is stuck at `processing` because its `agent_llm_end` was
    // lost — that orphan otherwise keeps both the header shimmer (via `inflight`)
    // and the content-box spinner alive until the whole message stops streaming.
    const done = !!subAgentDone.get(name);
    // Shimmer/spinner track the child's WHOLE lifecycle, not just live LLM
    // content. subAgentRunning is true while the child has any non-terminal
    // action (LLM processing OR a tool call executing) AND has not yet returned,
    // so a child running tools keeps spinning instead of looking finished.
    // `inflight`/current action are placement fallbacks, but a finished child
    // (`done`) never counts as running. A hard-failed child is terminal
    // (handled via subAgentErrors) → never shimmer it (#4993).
    const running =
      !childError &&
      !done &&
      (!!subAgentRunning.get(name) || !!inflight || (currentActionKey === name && currentActionRunning));
    return (
      <SubAgentAccordion
        key={`sa-${name}`}
        name={name}
        tools={tools}
        agentType={subEntry?.agentType}
        running={running}
        defaultExpanded={!!childError}
      >
        {groups.length > 0 && (
          <Box sx={badgesContainerSx}>
            {groups.flatMap((group, i) => renderGroupChips(group, `${name}-${i}`, true, inflight, true))}
          </Box>
        )}
        {inflight ? (
          // A finished child still keeps its streamed content visible, but with
          // no spinner / streaming footer — the orphan-`processing` LLM is shown
          // as settled output, not as live progress.
          <ActionView
            showProgress={!done}
            action={inflight}
            tools={tools}
            isStreaming={!done}
          />
        ) : (
          currentActionKey === name && currentActionBox
        )}
        {childError && (
          <ErrorTrace
            compact
            headline={childError.headline || childError.exception}
            trace={childError.exception}
            messageId={messageId}
            onCopy={onCopy}
          />
        )}
      </SubAgentAccordion>
    );
  };

  return (
    <>
      {blocks.map((block, bi) =>
        block.kind === 'coord'
          ? block.groups.length > 0 && (
              <Box
                key={`coord-${bi}`}
                sx={badgesContainerSx}
              >
                {block.groups.flatMap((group, i) => renderGroupChips(group, `coord-${bi}-${i}`, true))}
              </Box>
            )
          : renderSub(block.name),
      )}
      {extraSub.map(name => renderSub(name))}
      {currentActionKey === '' && currentActionBox}
    </>
  );
});

StreamingThinkBlocks.displayName = 'StreamingThinkBlocks';

const ApplicationThinkView = memo(props => {
  const {
    defaultExpanded = false,
    actions,
    originalActions,
    isStreaming = false,
    tools,
    subAgentTypeByName,
    subAgentErrors = null,
    messageId,
    onCopy,
  } = props;

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

  // Partition the raw ACTIONS into an ORDERED list of blocks that preserves the
  // chronological turn order: a coordinator (orchestrator) run, then the
  // sub-agents it fanned out to, then the orchestrator's closing run — exactly
  // the sequence the model produced (issue #4993). A coordinator block is a run
  // of consecutive orchestrator actions (no sub-agent key); it closes as soon as
  // a sub-agent action appears, so a later orchestrator turn (e.g. the final
  // summary after a parallel fan-out) becomes its OWN block at the bottom rather
  // than being pulled to the top. Each sub-agent gets ONE accordion slot anchored
  // at its first action; later same-name actions (interleaved in a parallel turn)
  // append to that slot so the chips don't scatter.
  // The sub-agent's kind (pipeline vs agent) for the accordion header icon. The
  // participant `tools` list does not carry nested sub-agents (esp. for durable
  // fan-out children), so resolveSubAgentIcon's tools lookup misses and falls
  // back to the generic agent icon. Recover the kind from the sub-agent's OWN
  // self-named invocation chip (its tool name === the sub-agent name), which
  // carries agent_type/toolkit_type in toolMeta (#4993).
  const deriveSubAgentType = useCallback(
    (name, blockActions) => {
      // Primary signal: the conversation participant's authoritative kind, keyed
      // by display name. Available from page load in every mode, so the header
      // icon resolves correctly DURING streaming — unlike the invocation chip's
      // agent_type='pipeline', which the SDK only emits on the LAST chip of a
      // fan-out (mid-stream the only self-chips carry the inner node's
      // agent_type='openai'). In ad-hoc mode the participant `tools` list is
      // empty, so this map is the only early pipeline signal (#4993).
      const participantType = subAgentTypeByName?.[name];
      if (participantType === 'pipeline') return 'pipeline';
      if (participantType) return 'application';

      const stripped = name.replace(/\s/g, '');
      // Fallback (no participant entry, e.g. nested/dynamic sub-agents): a
      // sub-agent's block contains MULTIPLE self-named chips — the outer
      // delegation invocation (tool name === the sub-agent's display name, e.g.
      // "Name Resolver", carrying agent_type='pipeline') AND, for a pipeline,
      // the pipeline's own inner LLM node whose whitespace-stripped name also
      // matches ("NameResolver", langgraph_node='Agent1', agent_type='openai').
      // Scan ALL self-named chips and let 'pipeline' win; 'application' is the
      // fallback. (Taking the first .find() match grabbed the inner node →
      // 'application' → grid icon while the real chip resolved to 'pipeline'.)
      const selfs = blockActions.filter(a => {
        const an = (a?.name || '').trim();
        return an === name || an === stripped;
      });
      let best = '';
      for (const self of selfs) {
        // Resolve through the SAME authoritative path the self-invocation chip
        // uses (getToolInfoFromAction → resolveToolkitType), so the accordion
        // header icon always matches the chip inside it.
        const resolvedType = getToolInfoFromAction(self, tools)?.toolkitType;
        if (resolvedType === 'pipeline') return 'pipeline';
        if (resolvedType === 'application') best = 'application';
      }
      return best;
    },
    [tools, subAgentTypeByName],
  );

  const partitionIntoBlocks = useCallback(
    actionsList => {
      const blocks = [];
      const subBlockByName = new Map();
      let coordRun = [];
      const flushCoord = () => {
        if (coordRun.length > 0) {
          blocks.push({ kind: 'coord', actions: coordRun });
          coordRun = [];
        }
      };
      actionsList.forEach(action => {
        const key = deriveSubAgentName(action);
        if (!key) {
          coordRun.push(action);
          return;
        }
        flushCoord();
        const existing = subBlockByName.get(key);
        if (existing) {
          existing.actions.push(action);
        } else {
          const block = { kind: 'sub', name: key, actions: [action] };
          subBlockByName.set(key, block);
          blocks.push(block);
        }
      });
      flushCoord();
      return blocks.map(block =>
        block.kind === 'coord'
          ? { kind: 'coord', groups: groupActions(block.actions).groups }
          : {
              kind: 'sub',
              name: block.name,
              agentType: deriveSubAgentType(block.name, block.actions),
              groups: groupActions(block.actions).groups,
            },
      );
    },
    [deriveSubAgentName, deriveSubAgentType, groupActions],
  );

  // Revealed (finished) actions for streaming view; all actions for history view.
  const streamingBlocks = useMemo(
    () => partitionIntoBlocks(finishedActions),
    [partitionIntoBlocks, finishedActions],
  );
  const historyBlocks = useMemo(() => partitionIntoBlocks(actions), [partitionIntoBlocks, actions]);

  // Sub-agent accordions are collapsed by default and opened on demand to inspect
  // the child's activity. Their chips therefore render from the FULL set of
  // arrived actions (keyed by sub-agent name), NOT the throttled reveal window —
  // so an expanded running sub-agent shows every tool it has executed so far,
  // matching the history view (issue #4993). The reveal throttle still governs
  // the coordinator's inline chips and live content box only.
  const streamingSubGroupsFull = useMemo(() => {
    const map = new Map();
    historyBlocks.forEach(block => {
      if (block.kind === 'sub') map.set(block.name, { groups: block.groups, agentType: block.agentType });
    });
    return map;
  }, [historyBlocks]);

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

  // Per-sub-agent progress signals that span the child's WHOLE lifecycle (LLM +
  // tool-call phases) and — critically — stop the moment the child is truly done,
  // even when a stray inner LLM action never receives its terminal `agent_llm_end`
  // (an intermittent run-id mismatch on Anthropic that otherwise leaves the action
  // stuck at `processing` forever, spinning until the whole message stops).
  //
  // The authoritative "child returned" signal is the parent's invocation-wrapper
  // tool action — a `tool`-type action whose name IS the child's own name
  // (`tool:<ChildName>`), emitted by the parent's ToolNode and completed via
  // `agent_tool_end` when the child hands its result back. This is a SEPARATE
  // event from the child's inner `agent_llm_end`, so it lands reliably even when
  // an inner LLM end is lost.
  //
  // - `subAgentDone`: wrapper is terminal → the child has returned. Suppresses
  //   BOTH the accordion-header shimmer AND the inflight content-box spinner,
  //   regardless of any dangling `processing` inner action (the lost-event orphan).
  // - `subAgentRunning`: the child has a non-terminal action AND has NOT yet
  //   returned (wrapper not terminal) → genuinely working. The wrapper is itself
  //   `processing` (or absent) during the run, so this stays true through the LLM
  //   and tool phases. A hard-failed child is handled via subAgentErrors (#4993).
  const { subAgentRunning, subAgentDone } = useMemo(() => {
    const hasNonTerminal = new Map();
    const wrapperTerminal = new Map();
    actions.forEach(a => {
      if (!a) return;
      const key = deriveSubAgentName(a);
      if (!key) return;
      const terminal =
        a.status === ToolActionStatus.complete ||
        a.status === ToolActionStatus.error ||
        a.status === ToolActionStatus.cancelled;
      // The invocation wrapper: the parent's tool call that ran this child, so its
      // tool name matches the child's own name (not an inner toolkit/LLM action).
      const isWrapper =
        a.type === TOOL_ACTION_TYPES.Tool &&
        (a.name === key || a.original_name === key || a.name === a.parent_agent_name);
      if (isWrapper) {
        if (terminal) wrapperTerminal.set(key, true);
      } else if (!terminal) {
        hasNonTerminal.set(key, true);
      }
    });
    const running = new Map();
    hasNonTerminal.forEach((_, key) => {
      if (!wrapperTerminal.get(key)) running.set(key, true);
    });
    return { subAgentRunning: running, subAgentDone: wrapperTerminal };
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
    // Wall-clock span of the whole turn = earliest start → latest end across ALL
    // actions, NOT the positional first/last. In a parallel fan-out the two
    // children's actions interleave, so originalActions is not strictly
    // chronological and [0]/[last] under-report the real elapsed time (#4993).
    let minStart = Infinity;
    let maxEnd = -Infinity;
    originalActions.forEach(a => {
      if (!a) return;
      const start = new Date(a.created_at ?? a.timestamp ?? NaN).getTime();
      if (!Number.isNaN(start)) minStart = Math.min(minStart, start);
      const end = new Date(a.timestamp ?? a.ended_at ?? a.created_at ?? NaN).getTime();
      if (!Number.isNaN(end)) maxEnd = Math.max(maxEnd, end);
    });
    if (minStart === Infinity || maxEnd === -Infinity) return ChatHelpers.calculateDuration();
    return ChatHelpers.calculateDuration(minStart, maxEnd);
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
    (group, keyPrefix, streaming, inflightAction, fullToolNames = false) => {
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
            onlyShowToolkit={streaming && !fullToolNames}
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

  // The reveal throttle can park displayedActionIndex on an action that has
  // already gone terminal (a child that finished first while a sibling is at
  // HITL keeps the streaming view mounted). Drive the spinner + streaming
  // footer off the action's real status so a settled box stops spinning (#4993).
  const currentActionIsLive =
    showCurrentAction &&
    mergedCurrentAction?.status !== ToolActionStatus.complete &&
    mergedCurrentAction?.status !== ToolActionStatus.error &&
    mergedCurrentAction?.status !== ToolActionStatus.cancelled;

  const currentActionBox = showCurrentAction ? (
    <ActionView
      showProgress={currentActionIsLive}
      action={mergedCurrentAction}
      tools={tools}
      isStreaming={currentActionIsLive}
    />
  ) : null;

  return isStreaming ? (
    <Box sx={styles.streamingContainer}>
      {/* SwarmChild actions are NOT rendered here during streaming.
          They will be rendered as separate accordions in ApplicationAnswer
          after streaming completes (!isProcessing). */}
      <StreamingThinkBlocks
        blocks={streamingBlocks}
        streamingSubGroupsFull={streamingSubGroupsFull}
        subAgentInflight={subAgentInflight}
        subAgentRunning={subAgentRunning}
        subAgentDone={subAgentDone}
        currentActionKey={currentActionKey}
        currentActionRunning={currentActionIsLive}
        currentActionBox={currentActionBox}
        subAgentErrors={subAgentErrors}
        messageId={messageId}
        onCopy={onCopy}
        tools={tools}
        renderGroupChips={renderGroupChips}
        badgesContainerSx={styles.badgesContainer}
      />
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
        {historyBlocks.map((block, bi) =>
          block.kind === 'coord' ? (
            block.groups.length > 0 && (
              <Box
                key={`coord-${bi}`}
                sx={styles.badgesContainer}
              >
                {block.groups.flatMap((group, i) => renderGroupChips(group, `coord-${bi}-${i}`, false))}
              </Box>
            )
          ) : (
            <SubAgentAccordion
              key={`sa-${block.name}`}
              name={block.name}
              tools={tools}
              agentType={block.agentType}
              defaultExpanded={!!subAgentErrors?.[block.name]}
            >
              <Box sx={styles.badgesContainer}>
                {block.groups.flatMap((group, i) => renderGroupChips(group, `${block.name}-${i}`, false))}
              </Box>
              {subAgentErrors?.[block.name] && (
                <ErrorTrace
                  compact
                  headline={subAgentErrors[block.name].headline || subAgentErrors[block.name].exception}
                  trace={subAgentErrors[block.name].exception}
                  messageId={messageId}
                  onCopy={onCopy}
                />
              )}
            </SubAgentAccordion>
          ),
        )}
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
