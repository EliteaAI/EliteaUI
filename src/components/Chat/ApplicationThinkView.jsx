import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { ChatHelpers } from '@/[fsd]/features/chat/lib/helpers';
import {
  collapseDelegationWrapperReplays,
  getActionOwnerPath,
  getSubAgentInstanceKey,
  getSubAgentName,
  omitSupersededGraphInterruptActions,
  resolveAgentPathActivity,
  resolvePendingAgentPaths,
} from '@/[fsd]/features/chat/lib/helpers/executionHierarchy.helpers.js';
import {
  buildPcidAnchorMap,
  computeBreadcrumbs,
  inflightToolChipId,
  isInvocationId,
  partitionActionsIntoBlocks,
  resolveExtraSubAgentKeys,
  resolveSubAgentLiveness,
  selectRichestAgentPath,
} from '@/[fsd]/features/chat/lib/helpers/subAgentGrouping.helpers.js';
import { ErrorTrace } from '@/[fsd]/features/chat/ui/error-trace';
import { SubAgentAccordion } from '@/[fsd]/features/chat/ui/sub-agent-section';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { StyledAccordion, StyledAccordionDetails, StyledAccordionSummary } from '@/[fsd]/shared/ui/accordion';
import ArrowRightIcon from '@/assets/arrow-right-icon.svg?react';
import { TOOL_ACTION_NAMES, TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';
import { getToolInfoFromAction } from '@/common/toolActionUitls';

import ActionView from './ActionView';

const SubAgentThinkBlock = memo(props => {
  const {
    instanceKey,
    subEntry,
    childError,
    inflight,
    lastRoundRunning,
    lastRoundDone,
    paused,
    resuming,
    hasActiveDescendant,
    isLiveCurrent,
    currentAction,
    currentActionRunning,
    currentActionBox,
    messageId,
    onCopy,
    tools,
    renderGroupChips,
    badgesContainerSx,
    streaming,
  } = props;
  const displayName = subEntry?.name || childError?.name || instanceKey;
  const ordinal = subEntry?.ordinal || 0;
  const label = subEntry?.breadcrumbLabel || (ordinal ? `${displayName} (${ordinal})` : displayName);
  const groups = subEntry?.groups || [];
  const { running, done } = resolveSubAgentLiveness({
    paused,
    resuming,
    hasActiveDescendant,
    lastRoundRunning,
    lastRoundDone,
    hasInflight: !!inflight,
    isLiveCurrent: isLiveCurrent && currentActionRunning,
    hasError: !!childError,
  });

  return (
    <SubAgentAccordion
      name={displayName}
      label={label}
      tools={tools}
      agentType={subEntry?.agentType}
      running={running}
      paused={paused}
    >
      {groups.length > 0 && (
        <Box sx={badgesContainerSx}>
          {groups.flatMap((group, index) =>
            renderGroupChips(
              group,
              `${instanceKey}-${index}`,
              streaming,
              inflight || currentAction,
              streaming,
            ),
          )}
        </Box>
      )}
      {inflight ? (
        <ActionView
          showProgress={!done}
          action={inflight}
          tools={tools}
          isStreaming={!done}
        />
      ) : (
        isLiveCurrent && currentActionBox
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
});

SubAgentThinkBlock.displayName = 'SubAgentThinkBlock';

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
    currentAction,
    currentActionRunning,
    currentActionBox,
    pendingAgentPaths,
    resumingAgentPaths,
    subAgentErrors,
    messageId,
    onCopy,
    tools,
    renderGroupChips,
    badgesContainerSx,
    streaming = true,
  } = props;

  // Sub-agents already represented by a revealed block render their in-flight
  // box inline. Any sub-agent that ONLY has an in-flight box (no revealed
  // chips yet, so absent from blocks) is the newest activity → append after
  // the ordered blocks. The orchestrator's own in-flight box sits at the very
  // bottom (its natural chronological turn — bottom of the thinking block).
  const renderedSubKeys = new Set(blocks.filter(b => b.kind === 'sub').map(b => b.instanceKey));
  const renderedSubNames = new Set(blocks.filter(b => b.kind === 'sub').map(b => b.name));

  // A sequential sub-agent that pauses for nested HITL is REPLAYED on resume with
  // a FRESH parent_agent_call_id (pcid); partitionActionsIntoBlocks folds those
  // rounds into ONE block anchored at the first pcid. But subAgentRunning /
  // Inflight / Done are keyed by each action's OWN raw pcid, so the live resume
  // round's pcid is NOT a block key. Map every raw round pcid back to its anchor
  // so the union below collapses it onto the real accordion instead of rendering
  // a spurious spinning `call_<id>` ghost (Bug 2).
  const pcidToAnchorKey = buildPcidAnchorMap(streamingSubGroupsFull);
  const resolveAnchor = key => (key && pcidToAnchorKey.get(key)) || key;

  // Keyed by sub-agent INVOCATION (parent_agent_call_id), so two calls to the
  // same sub-agent each get their own accordion (#5386). Any invocation with
  // arrived actions that the throttled reveal hasn't surfaced yet still gets an
  // accordion (its chips come from the full groups below). Each candidate key is
  // reconciled to its folded anchor and de-duplicated.
  const extraSub = resolveExtraSubAgentKeys({
    renderedKeys: renderedSubKeys,
    candidateKeys: [
      ...streamingSubGroupsFull.keys(),
      ...subAgentInflight.keys(),
      ...(subAgentRunning ? subAgentRunning.keys() : []),
      ...(currentActionKey ? [currentActionKey] : []),
    ],
    pcidToAnchorKey,
  });
  // A child that hard-failed before producing any revealed chip still needs an
  // accordion to host its error trace (#4993). New events are keyed by invocation;
  // legacy persisted state may still be keyed by display name.
  if (subAgentErrors) {
    const coveredNames = new Set(renderedSubNames);
    streamingSubGroupsFull.forEach(entry => entry?.name && coveredNames.add(entry.name));
    Object.entries(subAgentErrors).forEach(([errorKey, error]) => {
      const name = error?.name || errorKey;
      const isInvocationError = isInvocationId(errorKey) || Boolean(error?.name && errorKey !== error.name);
      if (
        !renderedSubKeys.has(errorKey) &&
        !extraSub.includes(errorKey) &&
        (isInvocationError || !coveredNames.has(name))
      ) {
        extraSub.push(errorKey);
      }
    });
  }

  // The live current-action box belongs to whichever invocation owns it; resolve
  // its raw pcid to the folded anchor so it renders under the real accordion
  // (and never keys an orphan call_<id> slot).
  const currentActionAnchor = resolveAnchor(currentActionKey);

  const subEntries = [...streamingSubGroupsFull.entries()];
  const effectivePendingPaths = resolvePendingAgentPaths(
    pendingAgentPaths,
    subEntries.filter(([, entry]) => entry?.pausedForResume).map(([, entry]) => entry.agentPath),
  );
  const activePaths = subEntries
    .filter(([key, entry]) => {
      const aliases = entry?.aliasKeys?.length ? entry.aliasKeys : [key];
      const lastKey = aliases[aliases.length - 1];
      return (
        subAgentRunning.get(lastKey) ||
        subAgentInflight.has(lastKey) ||
        (currentActionAnchor === key && currentActionRunning)
      );
    })
    .map(([, entry]) => entry.agentPath);
  const pathActivityByKey = new Map(
    subEntries.map(([key, entry]) => [
      key,
      resolveAgentPathActivity(entry.agentPath, {
        pendingPaths: effectivePendingPaths,
        resumingPaths: resumingAgentPaths,
        activePaths,
      }),
    ]),
  );

  const renderSub = key => {
    // Everything about one invocation is keyed by its instance key. The display
    // entry (full groups, agentType, name, ordinal) comes from the FULL
    // per-invocation groups (not the throttled window) so every executed tool
    // shows while the child is still running, with full tool names. When the key
    // is a name fallback (errored child with no block) subEntry is absent and the
    // key IS the display name.
    const subEntry = streamingSubGroupsFull.get(key);
    // Defense (Bug 2): a raw invocation id without either a block or an
    // invocation-scoped error means a folded resume round leaked the union.
    const keyedError = subAgentErrors?.[key];
    if (!subEntry && isInvocationId(key) && !keyedError) return null;
    const displayName = subEntry?.name || keyedError?.name || key;
    // One invocation can span several raw pcids: a sequential nested-HITL pause
    // RESUMES with a fresh pcid each round, and partitionActionsIntoBlocks folds
    // those rounds into this one block (aliasKeys = anchor + every resume pcid).
    // The running / done / inflight signals are keyed by each round's OWN raw
    // pcid, so reconcile across all aliases — the latest round drives liveness.
    const aliasKeys = subEntry?.aliasKeys?.length ? subEntry.aliasKeys : [key];
    const lastKey = aliasKeys[aliasKeys.length - 1];
    const inflight = subAgentInflight.get(lastKey);
    const childError = keyedError || subAgentErrors?.[displayName];
    const isLiveCurrent = currentActionAnchor === key;
    const pathActivity = pathActivityByKey.get(key) || {};
    return (
      <SubAgentThinkBlock
        key={`sa-${key}`}
        instanceKey={key}
        subEntry={subEntry}
        childError={childError}
        inflight={inflight}
        lastRoundRunning={!!subAgentRunning.get(lastKey)}
        lastRoundDone={!!subAgentDone.get(lastKey)}
        paused={!!pathActivity.paused}
        resuming={!!pathActivity.resuming}
        hasActiveDescendant={!!pathActivity.hasActiveDescendant}
        isLiveCurrent={isLiveCurrent}
        currentAction={isLiveCurrent ? currentAction : null}
        currentActionRunning={isLiveCurrent && currentActionRunning}
        currentActionBox={isLiveCurrent ? currentActionBox : null}
        messageId={messageId}
        onCopy={onCopy}
        tools={tools}
        renderGroupChips={renderGroupChips}
        badgesContainerSx={badgesContainerSx}
        streaming={streaming}
      />
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
                {block.groups.flatMap((group, i) =>
                  renderGroupChips(group, `coord-${bi}-${i}`, streaming, currentAction),
                )}
              </Box>
            )
          : renderSub(block.instanceKey),
      )}
      {extraSub.map(key => renderSub(key))}
      {currentActionAnchor === '' && currentActionBox}
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
    pendingAgentPaths = [],
    resumingAgentPaths = [],
    messageId,
    onCopy,
  } = props;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [displayedActionIndex, setDisplayedActionIndex] = useState(0);
  const displayTimerId = useRef(-1);
  const previousActionsLength = useRef(actions.length);
  const emptySignalMap = useMemo(() => new Map(), []);

  const styles = useMemo(applicationThinkViewStyles, []);

  useEffect(() => {
    // A live tree stays expanded when it becomes persisted, avoiding a mode
    // switch remount/collapse. Messages loaded directly from history keep the
    // caller's default expansion state.
    if (isStreaming) setExpanded(true);
  }, [isStreaming]);

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
      collapseDelegationWrapperReplays(actionsList).forEach(action => {
        // Extract SwarmChild actions to render separately with full content
        if (isSwarmChildAction(action)) {
          swarmChildren.push(action);
          return;
        }
        if (isReasoningAction(action)) {
          // Skip ALL LLM actions with empty content AND empty thinking (transition steps)
          // Named LLM actions (Start, Chat) with actual content or thinking should still show their chips.
          // Reloaded pins (TS-4) carry a traceStepId and lazy (empty) content, but the backend already
          // dropped blank thinking steps from the list — so a reloaded pin is known non-blank and is kept.
          const hasContent =
            (action.content && action.content.trim()) ||
            (action.thinking && action.thinking.trim()) ||
            !!action.traceStepId;
          const belongsToSubAgent = Boolean(getSubAgentName(action));
          if (!hasContent && action.type === TOOL_ACTION_TYPES.Llm && !belongsToSubAgent) {
            return; // Skip empty LLM actions (transition steps)
          }
          // Skip LLM actions without a proper node name (transition actions before name is set)
          // These show as just model name without ": NodeName" suffix
          // Also skip actions with default "Thinking step" name - these are transition markers.
          // Reloaded pins (traceStepId) are exempt: the backend already dropped blank steps, so a
          // default-named reloaded pin is a real single-LLM answer, not a transition marker.
          if (
            action.type === TOOL_ACTION_TYPES.Llm &&
            !action.traceStepId &&
            (!action.name || action.name === TOOL_ACTION_NAMES.Llm) &&
            !belongsToSubAgent
          ) {
            return; // Skip nameless/default transition actions
          }
          if (currentGroup.tools.length > 0 || currentGroup.reasoning) {
            groups.push(currentGroup);
          }
          currentGroup = { reasoning: action, tools: [] };
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

  // The sub-agent an action originated from — drives whether the action lands in
  // a sub-agent ACCORDION (true delegated invocation) or stays a flat coordinator
  // chip. Only TWO signals mark a true sub-agent, and they are the only ones the
  // backend stamps exclusively on delegation (never on a plain pipeline node):
  //   1. parent_agent_name — present on every INNER chip of a nested Application
  //      invocation (in-process nested config, or durable fan-out event overlay).
  //   2. the delegation WRAPPER chip — the parent's tool call into the sub-agent,
  //      identified by toolkit_type 'application'/'pipeline' (or any agent_type);
  //      its original_name is the sub-agent's display name.
  // A plain pipeline node (#5389) carries NEITHER: its node name lives only in
  // langgraph_node / checkpoint_ns ("{Node}:{uuid}") and its tools are
  // internal/mcp/toolkit-typed — so it resolves to '' (coordinator) and renders
  // as a flat, node-labeled chip in BOTH streaming and reload, with no accordion.
  // (Previously a bare original_name/checkpoint_ns fallback misread pipeline nodes
  // as sub-agents during streaming only, diverging from the flat reload view.)
  const deriveSubAgentName = useCallback(item => getSubAgentName(item), []);

  // The full ancestry chain for depth-3 nested sub-agents (#5778 Phase 6):
  // an ORDERED [{name, call_id}] array, one entry per ancestor hop from the
  // root's first child down to the immediate parent. Depth-1 (today's only
  // shape) yields a 1-element array; absent/older backends yield []. Mirrors
  // deriveSubAgentName's two-location fallback (bare field vs. toolMeta).
  const deriveSubAgentPath = useCallback(item => {
    if (!item) return [];
    return getActionOwnerPath(item);
  }, []);

  // A same-name parallel root carries a distinct sibling ordinal. It is display
  // ordering metadata, not durable identity, but it is the one authoritative
  // signal that a freshly observed call must not be folded into an older paused
  // sibling. Exact call-id matches still win before this fallback, so an existing
  // child remains stable even if a later resume batch renumbers its ordinal.
  const deriveRootSiblingOrdinal = useCallback(item => {
    const root = getActionOwnerPath(item)[0];
    return Number.isInteger(root?.sibling_ordinal) && root.sibling_ordinal > 0 ? root.sibling_ordinal : 0;
  }, []);

  // A unique key per sub-agent INVOCATION (not merely per name). Two sequential
  // or parallel calls to the same sub-agent share a display name (and, on the
  // in-process path, the same derived thread_id), so name-keying merges their
  // activity into one accordion (#5386). The backend stamps the parent
  // tool_call_id on EVERY event of one invocation (the wrapper tool event AND its
  // inner chips) as parent_agent_call_id; key off it so each invocation owns its
  // own accordion. Falls back to the display name when the id is absent (older
  // backend) — i.e. the prior merged behavior, so there is no regression.
  const deriveSubAgentInstanceKey = useCallback(item => {
    return getSubAgentInstanceKey(item);
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

  // Classify an action's role for the grouping fallback: is it the invocation
  // WRAPPER, and if so is it paused awaiting a sequential HITL resume? A nested
  // HITL pause surfaces as a terminal ERROR on the wrapper (on_tool_error) and
  // is the ONLY state in which a fresh-pcid resume round should fold back into
  // the same accordion (#5386). A parallel sibling is processing or carries a
  // deferred sentinel (complete + hitlDeferred), never error-without-defer, so
  // it is classified 'active' and keeps its own accordion (#5378/#5379).
  const classifyWrapper = useCallback((a, name) => {
    const isInnerChip = !!(a.parent_agent_name || a.toolMeta?.parent_agent_name);
    const isWrapper =
      a.type === TOOL_ACTION_TYPES.Tool && !isInnerChip && (a.name === name || a.original_name === name);
    if (!isWrapper) return null;
    const deferred = !!a.hitlDeferred || !!a.toolMeta?.hitl_deferred;
    if (a.status === ToolActionStatus.error && !deferred) return 'paused';
    return 'active';
  }, []);

  const partitionIntoBlocks = useCallback(
    actionsList => {
      // Pure pcid-first / paused-block-fallback grouping lives in subAgentGrouping
      // (unit-tested). Decorate the raw ordered blocks here with the per-name
      // ordinal, the header icon kind, and the grouped chips.
      const blocks = partitionActionsIntoBlocks(actionsList, {
        deriveName: deriveSubAgentName,
        deriveInstanceKey: deriveSubAgentInstanceKey,
        deriveSiblingOrdinal: deriveRootSiblingOrdinal,
        classifyWrapper,
      });
      // Number same-name invocations "(1)", "(2)", … so otherwise-identical
      // accordions are distinguishable; single invocations keep a bare name.
      // Retain the legacy ordinal as a fallback for old events without a path.
      const nameTotals = new Map();
      blocks.forEach(b => {
        if (b.kind === 'sub') nameTotals.set(b.name, (nameTotals.get(b.name) || 0) + 1);
      });
      const nameSeen = new Map();
      // Each block's ancestry chain, derived from its REPRESENTATIVE action (the
      // first action in the block — same source the name/agentType already use)
      // via deriveSubAgentPath. One-hop and deeper paths use the same renderer.
      const decorated = blocks.map(block => {
        if (block.kind === 'coord') return { kind: 'coord', groups: groupActions(block.actions).groups };
        const seq = (nameSeen.get(block.name) || 0) + 1;
        nameSeen.set(block.name, seq);
        const ordinal = nameTotals.get(block.name) > 1 ? seq : 0;
        return {
          kind: 'sub',
          instanceKey: block.instanceKey,
          // Every raw per-round pcid folded into this invocation (anchor first),
          // so the live streaming union can map a resume round back to this
          // block instead of spawning a spurious call_<id> accordion (Bug 2).
          aliasKeys: block.aliasKeys,
          // True while the invocation is paused awaiting a sequential HITL resume
          // (wrapper errored without deferring). It keeps the leaf non-terminal;
          // the hierarchy activity resolver keeps only its ancestors shimmering.
          pausedForResume: block.pausedForResume,
          name: block.name,
          ordinal,
          agentType: deriveSubAgentType(block.name, block.actions),
          // Prefer the first action in the block that actually carries a
          // non-empty ancestry chain, not blindly actions[0] (#5778). A block's
          // representative first action can arrive before the backend has
          // populated parent_agent_path (streaming timing), leaving it empty and
          // dropping the breadcrumb even though later actions carry the chain.
          agentPath: selectRichestAgentPath(block.actions.map(deriveSubAgentPath)),
          groups: groupActions(block.actions).groups,
        };
      });
      // Compute one path-derived label for both one-hop and deeper blocks.
      const breadcrumbs = computeBreadcrumbs(
        decorated
          .filter(b => b.kind === 'sub')
          .map(b => ({ instanceKey: b.instanceKey, agentPath: b.agentPath })),
      );
      return decorated.map(block =>
        block.kind === 'sub' ? { ...block, breadcrumbLabel: breadcrumbs.get(block.instanceKey) } : block,
      );
    },
    [
      deriveSubAgentName,
      deriveSubAgentInstanceKey,
      deriveRootSiblingOrdinal,
      classifyWrapper,
      deriveSubAgentType,
      deriveSubAgentPath,
      groupActions,
    ],
  );

  // Revealed (finished) actions for streaming view; all actions for history view.
  const streamingBlocks = useMemo(
    () => partitionIntoBlocks(finishedActions),
    [partitionIntoBlocks, finishedActions],
  );
  const historyActions = useMemo(
    () => (isStreaming ? actions : omitSupersededGraphInterruptActions(actions)),
    [actions, isStreaming],
  );
  const historyBlocks = useMemo(
    () => partitionIntoBlocks(historyActions),
    [partitionIntoBlocks, historyActions],
  );

  // Sub-agent accordions are collapsed by default and opened on demand to inspect
  // the child's activity. Their chips therefore render from the FULL set of
  // arrived actions (keyed by sub-agent name), NOT the throttled reveal window —
  // so an expanded running sub-agent shows every tool it has executed so far,
  // matching the history view (issue #4993). The reveal throttle still governs
  // the coordinator's inline chips and live content box only.
  const streamingSubGroupsFull = useMemo(() => {
    const map = new Map();
    historyBlocks.forEach(block => {
      if (block.kind === 'sub') map.set(block.instanceKey, block);
    });
    return map;
  }, [historyBlocks]);

  // In-flight streaming LLM action per sub-agent → drives the parallel content
  // boxes (one per sub-agent, each ~5 lines). Keyed by sub-agent so two children
  // streaming the same node name don't bleed content into one box (issue #4993).
  const subAgentInflightSlots = useMemo(() => {
    const slots = [];
    actions.forEach((a, index) => {
      if (!a || a.type !== TOOL_ACTION_TYPES.Llm) return;
      const name = deriveSubAgentName(a);
      if (!name) return;
      const key = deriveSubAgentInstanceKey(a);
      const active =
        a.status !== ToolActionStatus.complete &&
        a.status !== ToolActionStatus.error &&
        a.status !== ToolActionStatus.cancelled;
      const hasContent = (a.content && a.content.trim()) || (a.thinking && a.thinking.trim());
      if (!active || !hasContent) return;
      slots.push({ key, index });
    });
    return slots;
  }, [actions, deriveSubAgentName, deriveSubAgentInstanceKey]);

  const subAgentInflight = useMemo(() => {
    const map = new Map();
    subAgentInflightSlots.forEach(({ key, index }) => {
      map.set(key, actions[index]);
    });
    return map;
  }, [actions, subAgentInflightSlots]);

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
      const name = deriveSubAgentName(a);
      if (!name) return;
      const key = deriveSubAgentInstanceKey(a);
      const terminal =
        a.status === ToolActionStatus.complete ||
        a.status === ToolActionStatus.error ||
        a.status === ToolActionStatus.cancelled;
      // The invocation wrapper that signals the child RETURNED is the parent's
      // bare tool call — emitted at the parent/coordinator level, so it is the
      // ONLY action for this child that carries NO parent_agent_name
      // (emit_subagent_invocation_chip omits it; #4993). EVERY inner chip is
      // stamped with parent_agent_name = the child name: the child's own LLM/tool
      // events, AND a PIPELINE child's self-named node chip (tool_name == child
      // name). That node chip completes (non-deferred) the instant the pipeline's
      // first node finishes — and because it can surface under a display name
      // while still reporting original_name == child name, an earlier name-equality
      // exclusion let it slip through, be mistaken for the wrapper, and flip the
      // child to "done" the moment it called any tool — killing the accordion
      // shimmer and rendering a still-paused child as finished (#5378/#5379).
      // Keying off the ABSENCE of parent_agent_name selects the wrapper robustly,
      // independent of any display-name vs original_name divergence.
      const isInnerChip = !!(a.parent_agent_name || a.toolMeta?.parent_agent_name);
      const isWrapper =
        a.type === TOOL_ACTION_TYPES.Tool && !isInnerChip && (a.name === name || a.original_name === name);
      // A parallel child that paused for sensitive-action approval (#5378) returns
      // a deferred sentinel: its wrapper ENDS (terminal) but the child is NOT done
      // — it awaits a human decision, and the aggregate approval card may not have
      // surfaced yet (siblings still running). Keep it non-terminal; the pending
      // HITL path pauses that leaf while keeping its ancestors active.
      const deferred = !!a.hitlDeferred || !!a.toolMeta?.hitl_deferred;
      if (isWrapper) {
        if (terminal && !deferred) wrapperTerminal.set(key, true);
        // A still-processing wrapper means the child is running. In the simple
        // sequential (in-process) path the child runs as a single TOOL whose inner
        // llm/tool events are stripped, so this wrapper is the child's ONLY action —
        // without this the accordion never shimmers/spins during the run. In parallel
        // mode the child's own inner actions already light hasNonTerminal, so this is
        // harmless there (#4993).
        else {
          // A later replay/start supersedes an older paused/error wrapper for
          // this invocation. Let the latest lifecycle drive the shimmer.
          wrapperTerminal.delete(key);
          hasNonTerminal.set(key, true);
        }
      } else if (!terminal) {
        hasNonTerminal.set(key, true);
      }
    });
    const running = new Map();
    hasNonTerminal.forEach((_, key) => {
      if (!wrapperTerminal.get(key)) running.set(key, true);
    });
    return { subAgentRunning: running, subAgentDone: wrapperTerminal };
  }, [actions, deriveSubAgentName, deriveSubAgentInstanceKey]);

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

  // Resume pruning can shrink the action list while the reveal cursor still
  // points beyond its end. Clamp only on shrink so the deliberate index ===
  // length terminal state remains valid during normal streaming.
  useEffect(() => {
    if (actions.length < previousActionsLength.current) {
      if (displayTimerId.current !== -1) {
        clearTimeout(displayTimerId.current);
        displayTimerId.current = -1;
      }
      setDisplayedActionIndex(index => Math.min(index, Math.max(0, actions.length - 1)));
    }
    previousActionsLength.current = actions.length;
  }, [actions.length]);

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
    const currentKey = deriveSubAgentInstanceKey(currentAction);
    const sameNameFinished = finishedActions.filter(a => {
      if (a.type !== TOOL_ACTION_TYPES.Llm) return false;
      if (a.name?.trim().toLowerCase() !== currentName) return false;
      // Only merge within the SAME sub-agent — two children sharing a node name
      // must not pool their content into one box (issue #4993).
      if (deriveSubAgentInstanceKey(a) !== currentKey) return false;
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
  }, [actions, displayedActionIndex, finishedActions, deriveSubAgentInstanceKey]);

  // Render the chips for one turn-group. Streaming keeps the "skip reasoning chip
  // when it's the same node as the in-flight action" behavior and shows tool
  // chips as toolkit-only; history shows full tool chips (click → modal).
  const renderGroupChips = useCallback(
    (group, keyPrefix, streaming, inflightAction, fullToolNames = false) => {
      const items = [];
      let skipReasoning = false;
      // id of the in-flight TOOL action whose static chip must be skipped because
      // it is already rendered as the live spinner/content box below (#5428).
      let skipToolId = null;
      if (streaming) {
        // Compare against the in-flight box this bucket renders (sub-agent box,
        // or the coordinator's mergedCurrentAction) so an action isn't shown
        // twice — once as a chip and once as the live content box.
        const ref = inflightAction;
        const refIsLlm = ref?.type === TOOL_ACTION_TYPES.Llm;
        skipReasoning =
          refIsLlm && group.reasoning?.name?.trim().toLowerCase() === ref?.name?.trim().toLowerCase();
        // LLM duplicate is handled by skipReasoning (name match); the tool
        // duplicate is the in-flight tool action itself — skip its chip by id.
        skipToolId = inflightToolChipId(ref, TOOL_ACTION_TYPES.Tool);
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
        // Skip the in-flight tool action's static chip — it renders as the live
        // spinner box, so showing the chip too would duplicate it (#5428).
        if (skipToolId && action.id === skipToolId) return;
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
    [tools],
  );

  // Whether the in-flight current action should render its progress/content box,
  // and which sub-agent (if any) it belongs to so it sits under that section.
  const showCurrentAction =
    !!mergedCurrentAction &&
    displayedActionIndex >= finishedActions.length &&
    !(
      mergedCurrentAction.type === TOOL_ACTION_TYPES.Llm &&
      (!mergedCurrentAction.name || mergedCurrentAction.name === TOOL_ACTION_NAMES.Llm) &&
      !deriveSubAgentName(mergedCurrentAction)
    );
  const currentActionKey = showCurrentAction ? deriveSubAgentInstanceKey(mergedCurrentAction) : '';

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

  return (
    <StyledAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      defaultExpanded={defaultExpanded}
      expanded={isStreaming || expanded}
      onChange={isStreaming ? undefined : onExpanded}
      sx={[styles.accordion, isStreaming && styles.streamingAccordion]}
      slotProps={{ transition: { unmountOnExit: !isStreaming } }}
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
      <StyledAccordionDetails sx={isStreaming ? styles.streamingContainer : styles.accordionDetails}>
        {/* One component tree renders both live and persisted hierarchy. */}
        <StreamingThinkBlocks
          blocks={isStreaming ? streamingBlocks : historyBlocks}
          streamingSubGroupsFull={streamingSubGroupsFull}
          subAgentInflight={isStreaming ? subAgentInflight : emptySignalMap}
          subAgentRunning={isStreaming ? subAgentRunning : emptySignalMap}
          subAgentDone={isStreaming ? subAgentDone : emptySignalMap}
          currentActionKey={isStreaming ? currentActionKey : ''}
          currentAction={isStreaming ? mergedCurrentAction : null}
          currentActionRunning={isStreaming && currentActionIsLive}
          currentActionBox={isStreaming ? currentActionBox : null}
          pendingAgentPaths={isStreaming ? pendingAgentPaths : []}
          resumingAgentPaths={isStreaming ? resumingAgentPaths : []}
          subAgentErrors={subAgentErrors}
          messageId={messageId}
          onCopy={onCopy}
          tools={tools}
          renderGroupChips={renderGroupChips}
          badgesContainerSx={styles.badgesContainer}
          streaming={isStreaming}
        />
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
  streamingAccordion: {
    borderBottom: 'none',
    paddingBottom: '0 !important',
    '& .MuiAccordion-heading': { display: 'none' },
  },
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
