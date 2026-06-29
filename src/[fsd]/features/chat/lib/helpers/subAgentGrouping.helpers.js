// Pure, dependency-free sub-agent action grouping (#5386).
//
// Extracted from ApplicationThinkView so the grouping rule can be unit-tested in
// isolation (no React / MUI). The component supplies the field-derivation and
// wrapper-classification callbacks (which know its enums); this module owns only
// the algorithm.
//
// The problem: a sub-agent invocation that pauses for nested HITL is REPLAYED on
// every resume with a FRESH parent_agent_call_id (pcid) — the orchestrator
// re-plans and re-issues the call, so each round looks like a brand-new
// invocation. Keying accordions purely by pcid therefore scatters one logical
// invocation across N accordions, and the final reload (backend-deduped) snaps
// them back to one — the flicker in #5386.
//
// The rule (mirrors the backend's completion-epoch dedup so live and reload
// agree):
//   1. pcid match first — an action whose pcid already owns a block joins it.
//      PARALLEL invocations carry STABLE pcids, so they always match here and
//      stay in their own distinct blocks (#5378/#5379 untouched).
//   2. otherwise, fold the action into the most-recent same-name block ONLY IF
//      that block is currently PAUSED awaiting a sequential resume — i.e. its
//      wrapper errored without deferring. This is the unique signature of a
//      sequential nested-HITL pause; a parallel sibling is actively PROCESSING
//      (or deferred), never in this state, so its stable-pcid actions never get
//      folded into a sibling and the two stay distinct.
//   3. the wrapper's latest state drives `pausedForResume`: an errored,
//      non-deferred wrapper marks the block paused (a resume is coming);
//      anything else (processing / completed / deferred) clears it, so the next
//      genuinely separate invocation of the same sub-agent opens its own block.

/**
 * Partition a flat, chronological action list into ordered raw blocks.
 *
 * @param {Array} actionsList  chronological actions
 * @param {Object} opts
 * @param {(action:any)=>string} opts.deriveName         sub-agent display name ('' = coordinator)
 * @param {(action:any)=>string} opts.deriveInstanceKey  per-invocation key (pcid, falls back to name)
 * @param {(action:any, name:string)=>('paused'|'active'|null)} opts.classifyWrapper
 *        'paused'  → this action is the invocation wrapper, errored & awaiting a sequential HITL resume
 *        'active'  → this action is the wrapper in any other state (processing / completed / deferred)
 *        null      → not the wrapper; leave the block's pause state unchanged
 * @returns {Array} ordered blocks: {kind:'coord', actions} | {kind:'sub', instanceKey, name, actions, pausedForResume}
 */
export function partitionActionsIntoBlocks(actionsList, { deriveName, deriveInstanceKey, classifyWrapper }) {
  const blocks = [];
  const subBlockByKey = new Map(); // instanceKey (pcid) -> block
  const openBlockByName = new Map(); // name -> most-recent block for that name
  let coordRun = [];

  const flushCoord = () => {
    if (coordRun.length > 0) {
      blocks.push({ kind: 'coord', actions: coordRun });
      coordRun = [];
    }
  };

  (actionsList || []).forEach(action => {
    const name = deriveName(action);
    if (!name) {
      coordRun.push(action);
      return;
    }
    const instanceKey = deriveInstanceKey(action);
    flushCoord();

    // (1) exact invocation (pcid) match.
    let block = subBlockByKey.get(instanceKey);

    // (2) no pcid match → fold a fresh-pcid sequential-resume replay into the
    //     most-recent same-name block, but ONLY while that block is paused
    //     awaiting a resume. Parallel siblings are processing/deferred (never
    //     paused-on-error), so they are never folded in here.
    if (!block) {
      const open = openBlockByName.get(name);
      if (open && open.pausedForResume) {
        block = open;
        subBlockByKey.set(instanceKey, block); // alias this fresh pcid onto the block
        // Record the folded resume-round pcid so the live streaming view can map
        // it back to this block's anchor instanceKey (#5386 / Bug 2) instead of
        // surfacing it as a spurious extra `call_<id>` accordion.
        if (!block.aliasKeys.includes(instanceKey)) block.aliasKeys.push(instanceKey);
      }
    }

    if (block) {
      block.actions.push(action);
    } else {
      block = {
        kind: 'sub',
        instanceKey,
        name,
        actions: [action],
        pausedForResume: false,
        aliasKeys: [instanceKey],
      };
      subBlockByKey.set(instanceKey, block);
      openBlockByName.set(name, block);
      blocks.push(block);
    }

    // (3) update the block's resume-pause state from the wrapper's latest state.
    const phase = classifyWrapper(action, name);
    if (phase === 'paused') block.pausedForResume = true;
    else if (phase === 'active') block.pausedForResume = false;
  });

  flushCoord();
  return blocks;
}

// Reload/finalize epoch-collapse (#5386).
//
// During LIVE streaming the sub-agent wrapper keeps its FIRST-round
// parent_agent_call_id (the hook updates the action in place), so a sequential
// sub-agent invoked twice yields two stable keys and two accordions. On
// FINALIZE/RELOAD convertToAIAnswer rebuilds the actions from persisted meta,
// where the backend stored the per-resume-round pcid VERBATIM — so one logical
// invocation appears as several OVER-SPLIT pcids (prod group 1230: 8 pcids for 2
// invocations) and every chip is `complete` (the live paused-state signal the
// grouping relies on is gone). Keyed raw, the grouping then either over-splits
// (one accordion per round) or — once the names collapse — snaps the two
// invocations into one: the flicker/collapse the user sees "at the very end".
//
// This pass rewrites each reload action's parent_agent_call_id to its completion
// epoch's ANCHOR — the FIRST pcid seen in that epoch — which is exactly the key
// the live stream used, so live and reload agree (no remount, no flicker) and
// the two invocations stay two accordions.
//
// Sequential vs parallel: a SEQUENTIAL invocation re-fires in CONTIGUOUS pcid
// runs (round N fully precedes round N+1), closed by a bare-wrapper completion.
// CONCURRENT same-agent invocations (#5378/#5379) instead INTERLEAVE — a pcid
// reappears after a different one — and carry their own stable pcids. We detect
// that interleaving per sub-agent name and leave those keys untouched, so the
// epoch-collapse can never merge genuine parallel siblings. (Parallel siblings
// with DIFFERENT names are already separated by name.)
//
// @param {Array} toolActions  the rebuilt, chronological reload actions (mutated in place)
// @param {Object} opts
// @param {(a)=>string} opts.deriveName            sub-agent name ('' = coordinator, skipped)
// @param {(a)=>string} opts.deriveRawKey          raw per-round pcid ('' if none)
// @param {(a,name)=>boolean} opts.isWrapperCompletion  bare wrapper carrying a real result
// @returns {Array} the same toolActions, with parent_agent_call_id normalised
export function collapseSubAgentInvocationKeys(
  toolActions,
  { deriveName, deriveRawKey, isWrapperCompletion },
) {
  const actions = toolActions || [];

  // Pass 0 — flag per-name CONCURRENCY: a pcid that reappears after a different
  // pcid of the same name can only be two siblings streaming at once (parallel).
  const parallelNames = new Set();
  const lastKeyByName = new Map();
  const seenKeysByName = new Map();
  actions.forEach(a => {
    const name = deriveName(a);
    if (!name) return;
    const raw = deriveRawKey(a);
    if (!raw) return;
    let seen = seenKeysByName.get(name);
    if (!seen) {
      seen = new Set();
      seenKeysByName.set(name, seen);
    }
    const last = lastKeyByName.get(name);
    if (last && raw !== last && seen.has(raw)) parallelNames.add(name);
    seen.add(raw);
    lastKeyByName.set(name, raw);
  });

  // Pass 1 — bucket each sequential sub-agent action into its completion epoch.
  // A bare-wrapper completion CLOSES the epoch; the wrapper's own trailing inner
  // chip shares its pcid (so a chip whose pcid equals the epoch anchor OR the
  // closing pcid stays put) and only a genuinely new pcid opens the next epoch.
  const epochByName = new Map(); // name -> current open epoch
  const epochs = [];
  actions.forEach(a => {
    const name = deriveName(a);
    if (!name || parallelNames.has(name)) return;
    const raw = deriveRawKey(a);
    let epoch = epochByName.get(name);
    if (epoch && epoch.closed && raw && raw !== epoch.anchor && raw !== epoch.closingKey) {
      epoch = null;
    }
    if (!epoch) {
      epoch = { actions: [], anchor: '', closed: false, closingKey: '' };
      epochByName.set(name, epoch);
      epochs.push({ epoch, name });
    }
    epoch.actions.push(a);
    if (!epoch.anchor && raw) epoch.anchor = raw; // first real pcid = the epoch anchor
    if (isWrapperCompletion(a, name)) {
      epoch.closed = true;
      epoch.closingKey = raw || epoch.closingKey;
    }
  });

  // Pass 2 — stamp every action in an epoch with that epoch's anchor key.
  epochs.forEach(({ epoch, name }) => {
    const key = epoch.anchor || name;
    epoch.actions.forEach(a => {
      a.parent_agent_call_id = key;
    });
  });

  return actions;
}

// Live streaming key reconciliation (#5386 / Bug 2).
//
// partitionActionsIntoBlocks FOLDS a sequential-resume round's fresh pcid into
// the anchor block (rule 2), so the ordered blocks (and streamingSubGroupsFull)
// are keyed by the anchor instanceKey. But subAgentRunning/Inflight/Done are
// keyed by each action's OWN raw pcid — the LIVE resume round. Without
// translation, the streaming key-union adds that raw pcid as an EXTRA key with
// no matching block entry, and the render falls back to showing the raw
// `call_<id>` as the accordion name (the spinning ghost accordion in Bug 2).
//
// buildPcidAnchorMap turns the decorated sub blocks' aliasKeys into a
// rawPcid -> anchorInstanceKey lookup so the union can collapse every round of
// one invocation back onto its single accordion.

/** Tool-call / run id shapes that must never be shown as a human accordion name. */
const INVOCATION_ID_RE = /^(call_|tooluse_|run--|chatcmpl|lc_run)/i;

/**
 * Whether a key is a raw invocation / tool-call id (not a sub-agent display name).
 * @param {string} key
 * @returns {boolean}
 */
export function isInvocationId(key) {
  return typeof key === 'string' && INVOCATION_ID_RE.test(key);
}

/**
 * Build a rawPcid -> anchor instanceKey map from the per-invocation sub groups.
 *
 * @param {Map<string,{aliasKeys?:string[]}>|Object} subGroups
 *        streamingSubGroupsFull-shaped: anchor instanceKey -> { aliasKeys, ... }
 * @returns {Map<string,string>} every alias pcid (and the anchor) -> anchor key
 */
export function buildPcidAnchorMap(subGroups) {
  const map = new Map();
  if (!subGroups) return map;
  const entries = subGroups instanceof Map ? subGroups.entries() : Object.entries(subGroups);
  for (const [instanceKey, entry] of entries) {
    const keys = entry && entry.aliasKeys && entry.aliasKeys.length ? entry.aliasKeys : [instanceKey];
    keys.forEach(k => {
      if (k) map.set(k, instanceKey);
    });
  }
  return map;
}

/**
 * Reconcile the streaming key-union: translate every candidate key (from
 * subAgentRunning/Inflight/streamingSubGroupsFull/currentAction) to its folded
 * anchor, drop the ones already rendered as ordered blocks, and de-duplicate —
 * so a sequential-resume round never surfaces as a spurious `call_<id>` extra
 * accordion (#5386 / Bug 2).
 *
 * @param {Object} p
 * @param {Set<string>|Iterable<string>} p.renderedKeys  anchor instanceKeys already rendered
 * @param {Iterable<string>} p.candidateKeys             raw keys from the live signals
 * @param {Map<string,string>} p.pcidToAnchorKey         rawPcid -> anchor instanceKey
 * @returns {string[]} ordered, de-duplicated ANCHOR keys to render as extras
 */
export function resolveExtraSubAgentKeys({ renderedKeys, candidateKeys, pcidToAnchorKey }) {
  const rendered = renderedKeys instanceof Set ? renderedKeys : new Set(renderedKeys || []);
  const extra = [];
  for (const key of candidateKeys || []) {
    if (!key) continue;
    const anchor = (pcidToAnchorKey && pcidToAnchorKey.get(key)) || key;
    if (!rendered.has(anchor) && !extra.includes(anchor)) extra.push(anchor);
  }
  return extra;
}

// Sub-agent accordion liveness (#5386 final — sequential HITL shimmer).
//
// One invocation can span several raw pcids (the anchor round + every folded
// sequential-resume round). The component's subAgentRunning/Done/Inflight maps
// are keyed by each round's OWN raw pcid, so the LATEST round (aliasKeys[last])
// drives liveness. The wrinkle: a sequential HITL pause surfaces as the wrapper
// ERRORING (status=error, not deferred), which subAgentDone reads as "returned"
// — but the invocation is only paused awaiting approval. `paused`
// (block.pausedForResume, the grouping's authoritative pause flag) keeps the
// accordion shimmering through that gap, mirroring the parallel-deferred case
// (#5378). The invocation is truly DONE only when its latest round's wrapper
// returned for real and nothing is paused or still running.

/**
 * Resolve a sub-agent accordion's running / done state from its reconciled
 * per-round signals.
 *
 * @param {Object} p
 * @param {boolean} p.paused           block.pausedForResume (awaiting a sequential HITL resume)
 * @param {boolean} p.lastRoundRunning subAgentRunning.get(lastAliasKey)
 * @param {boolean} p.lastRoundDone    subAgentDone.get(lastAliasKey)
 * @param {boolean} p.hasInflight      latest round has a live streaming LLM action
 * @param {boolean} p.isLiveCurrent    the live current-action box belongs to this invocation
 * @param {boolean} p.hasError         the child hard-failed (renders an error trace instead)
 * @returns {{running:boolean, done:boolean}}
 */
export function resolveSubAgentLiveness({
  paused,
  lastRoundRunning,
  lastRoundDone,
  hasInflight,
  isLiveCurrent,
  hasError,
}) {
  const done = !paused && !lastRoundRunning && !!lastRoundDone;
  const running = !hasError && !done && (!!paused || !!lastRoundRunning || !!hasInflight || !!isLiveCurrent);
  return { running, done };
}

/**
 * The in-flight tool action is ALSO rendered as the live spinner/content box
 * beneath the group chips inside a sub-agent accordion. Returns that action's id
 * so renderGroupChips can skip its STATIC chip — a streaming tool call then shows
 * once (the live box), not as a static chip + an identical spinning chip (#5428).
 * Only fires for tool-type refs; the LLM reasoning duplicate is already handled by
 * the existing skipReasoning name-match guard.
 *
 * @param {any} refAction  the action rendered as the live box (inflight box, or the
 *                         current-action box = actions[displayedActionIndex])
 * @param {string} toolType  the component's TOOL_ACTION_TYPES.Tool enum value
 * @returns {string|null}  the action id to skip, or null when there is nothing to skip
 */
export function inflightToolChipId(refAction, toolType) {
  return refAction && refAction.type === toolType ? (refAction.id ?? null) : null;
}
