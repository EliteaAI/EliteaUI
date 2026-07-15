import { describe, expect, it } from 'vitest';

import {
  buildPcidAnchorMap,
  collapseSubAgentInvocationKeys,
  computeBreadcrumbs,
  inflightToolChipId,
  isInvocationId,
  partitionActionsIntoBlocks,
  resolveExtraSubAgentKeys,
  resolveSubAgentLiveness,
  selectRichestAgentPath,
} from './subAgentGrouping.helpers.js';

// --- Minimal mirrors of the component's callbacks ------------------------- //

const TOOL = 'tool';
const SUB = 'Name Resolver';

// Mirror of ApplicationThinkView.deriveSubAgentName (#5389): a true sub-agent is
// marked ONLY by parent_agent_name (inner chips) or a delegation WRAPPER tool
// (toolkit_type application/pipeline, or any agent_type). A plain pipeline node
// (node name in `name`/checkpoint_ns, internal/toolkit-typed tool) is NOT a
// sub-agent → resolves to '' (coordinator → flat chip).
const deriveName = a => {
  const parent = a.parent_agent_name || a.toolMeta?.parent_agent_name;
  if (parent) return parent;
  const type = a.toolMeta?.toolkit_type;
  const isDelegationWrapper = type === 'application' || type === 'pipeline' || !!a.toolMeta?.agent_type;
  if (isDelegationWrapper && a.original_name) return a.original_name;
  return '';
};
const deriveInstanceKey = a => a.parent_agent_call_id || deriveName(a);
const classifyWrapper = (a, name) => {
  const isInner = !!a.parent_agent_name;
  const isWrapper = a.type === TOOL && !isInner && (a.name === name || a.original_name === name);
  if (!isWrapper) return null;
  const deferred = !!a.hitlDeferred;
  if (a.status === 'error' && !deferred) return 'paused';
  return 'active';
};

const run = actions =>
  partitionActionsIntoBlocks(actions, { deriveName, deriveInstanceKey, classifyWrapper });
const runWithOrdinals = actions =>
  partitionActionsIntoBlocks(actions, {
    deriveName,
    deriveInstanceKey,
    deriveSiblingOrdinal: action => action.rootOrdinal || 0,
    classifyWrapper,
  });
const subBlocks = result => result.filter(b => b.kind === 'sub');

// --- Action builders ------------------------------------------------------ //

// Invocation wrapper (no parent_agent_name): the orchestrator's call to the sub.
// A real delegation wrapper carries the sub-agent's kind in toolMeta.toolkit_type
// ('application' for an agent, 'pipeline' for a pipeline) — that, not the bare
// name, is what marks it a sub-agent under deriveName (#5389).
const wrap = (pcid, status, extra = {}) => ({
  type: TOOL,
  name: SUB,
  original_name: SUB,
  parent_agent_call_id: pcid,
  status,
  toolMeta: { toolkit_type: 'application' },
  ...extra,
});
// Inner chip emitted inside the sub-agent (carries parent_agent_name).
const inner = (pcid, status = 'complete') => ({
  type: TOOL,
  name: 'create_file',
  parent_agent_name: SUB,
  parent_agent_call_id: pcid,
  status,
});
const coord = () => ({ type: 'llm', name: 'think', status: 'complete' });

// --- Plain pipeline nodes (#5389) — NOT sub-agents ------------------------ //
// A single-shot LLM node inside a directly-run pipeline: node name in `name` and
// checkpoint_ns, NO parent_agent_name, NO delegation toolkit_type.
const pipeLlmNode = (name = 'Executor') => ({
  type: 'llm',
  name,
  status: 'complete',
  toolMeta: { ls_model_name: 'gpt-4o', checkpoint_ns: `${name}:abc-uuid` },
});
// A tool invoked by a pipeline node: original_name carries the node name (from
// checkpoint_ns) but the tool's own kind is internal/toolkit — never a delegation.
const pipeToolNode = (node = 'LLM5') => ({
  type: TOOL,
  name: 'create_page',
  original_name: node,
  status: 'complete',
  toolMeta: { toolkit_type: 'internal', checkpoint_ns: `${node}:abc-uuid` },
});

// --- Tests ---------------------------------------------------------------- //

describe('partitionActionsIntoBlocks — #5386 sequential grouping', () => {
  it('groups two sequential HITL invocations into exactly two blocks', () => {
    // Each invocation is replayed across rounds with a FRESH pcid; the first
    // rounds pause (wrapper error), the last completes. The two invocations
    // share the sub-agent name and even share args, but must stay distinct.
    const actions = [
      wrap('p1', 'error'),
      inner('p1'),
      wrap('p2', 'error'),
      inner('p2'),
      wrap('p3', 'complete'),
      inner('p3'),
      wrap('p4', 'error'),
      inner('p4'),
      wrap('p5', 'error'),
      inner('p5'),
      wrap('p6', 'complete'),
      inner('p6'),
    ];
    const subs = subBlocks(run(actions));
    expect(subs).toHaveLength(2);
    // Round 1-3 collapse into the first block, 4-6 into the second.
    expect(subs[0].actions).toHaveLength(6);
    expect(subs[1].actions).toHaveLength(6);
  });

  it('collapses a single multi-round invocation into one block (no over-split)', () => {
    const actions = [
      wrap('p1', 'error'),
      inner('p1'),
      wrap('p2', 'error'),
      inner('p2'),
      wrap('p3', 'complete'),
      inner('p3'),
    ];
    const subs = subBlocks(run(actions));
    expect(subs).toHaveLength(1);
    expect(subs[0].actions).toHaveLength(6);
  });

  it('matches the backend-deduped reload (two completed wrappers) to two blocks', () => {
    // On reload only the surviving completion per invocation is present.
    const actions = [wrap('pf1', 'complete'), inner('pf1'), wrap('pf2', 'complete'), inner('pf2')];
    expect(subBlocks(run(actions))).toHaveLength(2);
  });
});

describe('partitionActionsIntoBlocks — parallel must not regress (#5378/#5379)', () => {
  it('keeps two concurrent parallel invocations (both processing) distinct', () => {
    // Both wrappers are PROCESSING at once with stable distinct pcids. The
    // fallback must NOT fold the second into the first — only paused blocks merge.
    const actions = [
      wrap('pa', 'processing'),
      wrap('pb', 'processing'),
      inner('pa', 'processing'),
      inner('pb', 'processing'),
    ];
    expect(subBlocks(run(actions))).toHaveLength(2);
  });

  it('keeps two completed parallel invocations distinct', () => {
    const actions = [wrap('pa', 'complete'), wrap('pb', 'complete'), inner('pa'), inner('pb')];
    expect(subBlocks(run(actions))).toHaveLength(2);
  });

  it('does not merge parallel deferred (HITL) siblings', () => {
    // A parallel deferred pause is a COMPLETE wrapper with hitlDeferred — not an
    // error — so it never marks the block paused, and siblings stay distinct.
    const actions = [
      wrap('pa', 'complete', { hitlDeferred: true }),
      wrap('pb', 'complete', { hitlDeferred: true }),
    ];
    expect(subBlocks(run(actions))).toHaveLength(2);
  });

  it('does not fold a fresh processing sibling into an older paused invocation', () => {
    const actions = [
      wrap('paused-b1', 'error', { rootOrdinal: 1 }),
      wrap('running-b2', 'processing', { rootOrdinal: 2 }),
    ];
    expect(subBlocks(runWithOrdinals(actions))).toHaveLength(2);
  });
});

describe('partitionActionsIntoBlocks — plain pipeline nodes are NOT sub-agents (#5389)', () => {
  it('keeps a single-shot LLM pipeline node as a coordinator chip (no accordion)', () => {
    const result = run([pipeLlmNode('Executor')]);
    expect(result.map(b => b.kind)).toEqual(['coord']);
    expect(subBlocks(result)).toHaveLength(0);
  });

  it('keeps a pipeline node tool (original_name = node, internal toolkit) as coordinator', () => {
    const result = run([pipeToolNode('LLM5')]);
    expect(result.map(b => b.kind)).toEqual(['coord']);
    expect(subBlocks(result)).toHaveLength(0);
  });

  it('keeps a whole multi-node pipeline run flat (one coordinator block, no subs)', () => {
    const result = run([
      pipeLlmNode('Start'),
      pipeLlmNode('Executor'),
      pipeToolNode('Executor'),
      pipeLlmNode('LLM5'),
      pipeToolNode('LLM5'),
    ]);
    expect(subBlocks(result)).toHaveLength(0);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('coord');
  });

  it('still groups a TRUE sub-agent (parent_agent_name / delegation wrapper) into an accordion', () => {
    // A pipeline that ALSO delegates to a real sub-agent: the pipeline nodes stay
    // flat, the delegated sub-agent gets its own accordion.
    const result = run([pipeLlmNode('Start'), wrap('p1', 'complete'), inner('p1'), pipeLlmNode('End')]);
    const subs = subBlocks(result);
    expect(subs).toHaveLength(1);
    expect(subs[0].name).toBe(SUB);
    // pipeline nodes split the coordinator run around the sub-agent block
    expect(result.map(b => b.kind)).toEqual(['coord', 'sub', 'coord']);
  });
});

describe('partitionActionsIntoBlocks — ordering', () => {
  it('keeps coordinator runs as their own blocks between sub-agents', () => {
    const result = run([
      coord(),
      wrap('p1', 'complete'),
      inner('p1'),
      coord(),
      wrap('p2', 'complete'),
      inner('p2'),
    ]);
    expect(result.map(b => b.kind)).toEqual(['coord', 'sub', 'coord', 'sub']);
  });

  it('inner chips for a fresh resume pcid land in the same paused block', () => {
    // Round 2's inner chip arrives with p2 BEFORE p2 was ever seen as a wrapper;
    // it must still resolve to the paused block, not spawn its own.
    const result = run([
      wrap('p1', 'error'),
      inner('p2'), // resume round's inner chip, fresh pcid, block still paused
      wrap('p2', 'complete'),
    ]);
    const subs = subBlocks(result);
    expect(subs).toHaveLength(1);
    expect(subs[0].actions).toHaveLength(3);
  });
});

// --- Reload epoch-collapse (#5386) ---------------------------------------- //
//
// On reload/finalize convertToAIAnswer rebuilds tool actions from persisted
// meta. The backend persists the per-resume-round parent_agent_call_id, so a
// SEQUENTIAL sub-agent invoked twice arrives as 8 OVER-SPLIT pcids for 2 logical
// invocations (group 1230 in prod). Every chip is `complete` and only the final
// bare wrapper per invocation survives the backend dedup. collapseSubAgentInvocationKeys
// must rewrite each action's pcid to its completion-epoch ANCHOR (the first pcid
// of the epoch — which equals the live-streaming key, so no flicker), while
// leaving genuinely concurrent (parallel) same-agent pcids untouched.

// Reload-shaped bare wrapper: completed, carries the sub-agent's real output.
const rwrap = pcid => ({
  type: TOOL,
  name: SUB,
  original_name: SUB,
  parent_agent_call_id: pcid,
  status: 'complete',
  toolOutputs: 'sub-agent final answer',
  isError: false,
  toolMeta: { toolkit_type: 'application' },
});
// Reload-shaped inner chip: completed, stamped with the sub-agent name.
const rinner = pcid => ({
  type: TOOL,
  name: 'create_file',
  original_name: 'create_file',
  parent_agent_name: SUB,
  parent_agent_call_id: pcid,
  status: 'complete',
});
const rllm = name => ({ type: 'llm', name: 'think', parent_agent_name: name, status: 'complete' });

const reloadOpts = {
  deriveName: a => a.parent_agent_name || a.original_name || '',
  deriveRawKey: a => a.parent_agent_call_id || '',
  isWrapperCompletion: (a, name) =>
    a.type === TOOL &&
    !a.parent_agent_name &&
    (a.name === name || a.original_name === name) &&
    !a.isError &&
    !!a.toolOutputs,
};
const collapse = actions => collapseSubAgentInvocationKeys(actions, reloadOpts);
const distinctKeys = actions => [...new Set(actions.map(a => a.parent_agent_call_id))];

describe('collapseSubAgentInvocationKeys — #5386 sequential reload', () => {
  it('collapses 8 over-split pcids of two sequential invocations to two anchor keys', () => {
    // Mirror of prod group 1230: inv1 = TC7×5,319,d73,d79(wrap)+d79(inner);
    // inv2 = U9c×5,027,f1a,874(wrap)+874(inner). The bare wrapper closes each epoch.
    const actions = [
      rinner('TC7'),
      rinner('TC7'),
      rinner('TC7'),
      rinner('TC7'),
      rinner('TC7'),
      rinner('319'),
      rinner('d73'),
      rwrap('d79'),
      rinner('d79'),
      rinner('U9c'),
      rinner('U9c'),
      rinner('U9c'),
      rinner('U9c'),
      rinner('U9c'),
      rinner('027'),
      rinner('f1a'),
      rwrap('874'),
      rinner('874'),
    ];
    const collapsed = collapse(actions);
    expect(actions[5].parent_agent_call_id).toBe('319');
    expect(collapsed).not.toBe(actions);
    // Anchor = the FIRST pcid of each epoch (= the live-streaming key → no flicker).
    expect(distinctKeys(collapsed)).toEqual(['TC7', 'U9c']);
    // And the grouping now yields exactly two persistent blocks, not one collapsed.
    expect(subBlocks(run(collapsed))).toHaveLength(2);
  });

  it('keeps the wrapper trailing inner chip (shared pcid) inside the closing epoch', () => {
    // d79-inner shares the wrapper pcid d79 → must stay in epoch 1 (anchor TC7),
    // NOT spawn a fresh epoch; only the genuinely new pcid U9c opens epoch 2.
    const actions = [rinner('TC7'), rwrap('d79'), rinner('d79'), rinner('U9c'), rwrap('874')];
    const collapsed = collapse(actions);
    expect(collapsed[2].parent_agent_call_id).toBe('TC7');
    expect(collapsed[3].parent_agent_call_id).toBe('U9c');
    expect(distinctKeys(collapsed)).toEqual(['TC7', 'U9c']);
  });

  it('adopts the first REAL pcid as the anchor even when an LLM step (no pcid) leads the epoch', () => {
    const actions = [rllm(SUB), rinner('TC7'), rwrap('d79')];
    const collapsed = collapse(actions);
    expect(collapsed[0].parent_agent_call_id).toBe('TC7');
    expect(distinctKeys(collapsed)).toEqual(['TC7']);
  });

  it('collapses a single multi-round invocation to one anchor key', () => {
    const actions = [rinner('TC7'), rinner('319'), rwrap('d79'), rinner('d79')];
    const collapsed = collapse(actions);
    expect(distinctKeys(collapsed)).toEqual(['TC7']);
    expect(subBlocks(run(collapsed))).toHaveLength(1);
  });
});

describe('collapseSubAgentInvocationKeys — parallel must not regress (#5378/#5379)', () => {
  it('leaves two interleaved concurrent same-agent pcids untouched (no merge)', () => {
    // Parallel same-agent: two STABLE pcids interleave (A,B,A,B). They must each
    // keep their own key — epoch-collapse must NOT fold them into one block.
    const actions = [rwrap('A'), rwrap('B'), rinner('A'), rinner('B'), rinner('A'), rinner('B')];
    const collapsed = collapse(actions);
    expect(new Set(distinctKeys(collapsed))).toEqual(new Set(['A', 'B']));
    expect(subBlocks(run(collapsed))).toHaveLength(2);
  });

  it('leaves a single stable pcid per parallel sibling as its own key', () => {
    // Group 1232 shape: each parallel sibling has ONE stable pcid (no over-split).
    const actions = [rinner('A'), rinner('A'), rwrap('A')];
    const collapsed = collapse(actions);
    expect(distinctKeys(collapsed)).toEqual(['A']);
  });
});

// --- aliasKeys + streaming key reconciliation (#5386 / Bug 2) -------------- //
//
// The LIVE streaming view keys subAgentRunning/Inflight/Done by each action's
// OWN raw pcid, but partitionActionsIntoBlocks FOLDS a sequential-resume round's
// fresh pcid into the anchor block. Without reconciliation the resume round's raw
// pcid surfaces as a spurious extra accordion named with the raw `call_<id>`
// (Bug 2). aliasKeys exposes the fold so the streaming union can translate every
// raw round pcid back to its anchor instanceKey.

describe('partitionActionsIntoBlocks — aliasKeys (#5386 / Bug 2)', () => {
  it('records the folded resume-round pcid as an alias of the anchor block', () => {
    // One invocation: round 1 (Y) pauses for nested HITL, round 2 (X) resumes and
    // completes. The two rounds fold into ONE block anchored at Y.
    const subs = subBlocks(run([wrap('Y', 'error'), inner('Y'), wrap('X', 'complete'), inner('X')]));
    expect(subs).toHaveLength(1);
    expect(subs[0].instanceKey).toBe('Y');
    expect(subs[0].aliasKeys).toEqual(['Y', 'X']);
  });

  it('records every folded round pcid for two sequential invocations', () => {
    const subs = subBlocks(
      run([
        wrap('p1', 'error'),
        inner('p1'),
        wrap('p2', 'error'),
        inner('p2'),
        wrap('p3', 'complete'),
        inner('p3'),
        wrap('p4', 'error'),
        inner('p4'),
        wrap('p5', 'error'),
        inner('p5'),
        wrap('p6', 'complete'),
        inner('p6'),
      ]),
    );
    expect(subs).toHaveLength(2);
    expect(subs[0].aliasKeys).toEqual(['p1', 'p2', 'p3']);
    expect(subs[1].aliasKeys).toEqual(['p4', 'p5', 'p6']);
  });

  it('gives a parallel sibling only its own stable pcid as alias (no cross-fold)', () => {
    const subs = subBlocks(
      run([
        wrap('pa', 'processing'),
        wrap('pb', 'processing'),
        inner('pa', 'processing'),
        inner('pb', 'processing'),
      ]),
    );
    expect(subs).toHaveLength(2);
    expect(subs[0].aliasKeys).toEqual(['pa']);
    expect(subs[1].aliasKeys).toEqual(['pb']);
  });
});

describe('buildPcidAnchorMap', () => {
  it('maps every alias pcid (and the anchor) to the anchor instanceKey', () => {
    const groups = new Map([
      ['Y', { name: SUB, aliasKeys: ['Y', 'X'] }],
      ['pb', { name: SUB, aliasKeys: ['pb'] }],
    ]);
    const map = buildPcidAnchorMap(groups);
    expect(map.get('Y')).toBe('Y');
    expect(map.get('X')).toBe('Y');
    expect(map.get('pb')).toBe('pb');
  });

  it('falls back to the instanceKey when aliasKeys is absent', () => {
    const groups = new Map([['Z', { name: SUB }]]);
    expect(buildPcidAnchorMap(groups).get('Z')).toBe('Z');
  });
});

describe('resolveExtraSubAgentKeys — Bug 2 phantom suppression', () => {
  // subAgentRunning carries the raw resume pcid X; the anchor Y owns the block.
  const map = new Map([
    ['Y', 'Y'],
    ['X', 'Y'],
  ]);

  it('suppresses a folded resume-round pcid already rendered under its anchor', () => {
    const extra = resolveExtraSubAgentKeys({
      renderedKeys: new Set(['Y']),
      candidateKeys: ['Y', 'X'],
      pcidToAnchorKey: map,
    });
    expect(extra).toEqual([]); // NO spurious call_<id> accordion
  });

  it('emits the anchor (never the raw pcid) when the block is not yet rendered', () => {
    const extra = resolveExtraSubAgentKeys({
      renderedKeys: new Set(),
      candidateKeys: ['X'],
      pcidToAnchorKey: map,
    });
    expect(extra).toEqual(['Y']);
  });

  it('dedups multiple raw round pcids of one invocation to a single anchor', () => {
    const m = new Map([
      ['X1', 'Y'],
      ['X2', 'Y'],
      ['Y', 'Y'],
    ]);
    const extra = resolveExtraSubAgentKeys({
      renderedKeys: new Set(),
      candidateKeys: ['X1', 'X2', 'Y'],
      pcidToAnchorKey: m,
    });
    expect(extra).toEqual(['Y']);
  });

  it('passes an unrelated standalone key through unchanged', () => {
    const extra = resolveExtraSubAgentKeys({
      renderedKeys: new Set(),
      candidateKeys: ['Some Agent'],
      pcidToAnchorKey: map,
    });
    expect(extra).toEqual(['Some Agent']);
  });

  it('skips empty keys', () => {
    const extra = resolveExtraSubAgentKeys({
      renderedKeys: new Set(),
      candidateKeys: ['', undefined, null],
      pcidToAnchorKey: map,
    });
    expect(extra).toEqual([]);
  });
});

describe('isInvocationId', () => {
  it('flags raw invocation / tool-call ids', () => {
    ['call_c5cfd98fce', 'tooluse_abc', 'run--123', 'chatcmpl-xyz', 'lc_run_1'].forEach(k =>
      expect(isInvocationId(k)).toBe(true),
    );
  });

  it('does not flag human sub-agent display names or empties', () => {
    ['Name Resolver', 'Surname Resolver', '', undefined, null].forEach(k =>
      expect(isInvocationId(k)).toBe(false),
    );
  });
});

// --- resolveSubAgentLiveness (#5386/#5778 — nested HITL activity) ----------- //
//
// A sequential nested-HITL pause surfaces as the wrapper ERRORING (status=error,
// not deferred). subAgentDone counts that as "returned" (lastRoundDone=true) even
// though the invocation is only paused awaiting approval. The leaf pauses while
// its strict ancestors remain active; approval then marks that leaf as resuming.

describe('resolveSubAgentLiveness', () => {
  it('is running while the latest round is genuinely working', () => {
    expect(resolveSubAgentLiveness({ paused: false, lastRoundRunning: true, lastRoundDone: false })).toEqual({
      running: true,
      done: false,
    });
  });

  it('is done once the latest round returned for real and nothing is live', () => {
    expect(resolveSubAgentLiveness({ paused: false, lastRoundRunning: false, lastRoundDone: true })).toEqual({
      running: false,
      done: true,
    });
  });

  it('pauses the interrupted leaf without marking it done', () => {
    expect(resolveSubAgentLiveness({ paused: true, lastRoundRunning: false, lastRoundDone: true })).toEqual({
      running: false,
      done: false,
    });
  });

  it('keeps an ancestor running while a descendant is paused', () => {
    expect(
      resolveSubAgentLiveness({
        paused: false,
        lastRoundRunning: false,
        lastRoundDone: true,
        hasActiveDescendant: true,
      }),
    ).toEqual({ running: true, done: false });
  });

  it('resumes the approved leaf before its next socket action arrives', () => {
    expect(
      resolveSubAgentLiveness({
        paused: false,
        lastRoundRunning: false,
        lastRoundDone: true,
        resuming: true,
      }),
    ).toEqual({ running: true, done: false });
  });

  it('shimmers while it owns the live current-action box', () => {
    expect(
      resolveSubAgentLiveness({
        paused: false,
        lastRoundRunning: false,
        lastRoundDone: false,
        isLiveCurrent: true,
      }),
    ).toEqual({ running: true, done: false });
  });

  it('shimmers while a live inflight LLM action is streaming', () => {
    expect(
      resolveSubAgentLiveness({
        paused: false,
        lastRoundRunning: false,
        lastRoundDone: false,
        hasInflight: true,
      }),
    ).toEqual({ running: true, done: false });
  });

  it('never shimmers when the child hard-failed (error trace renders instead)', () => {
    expect(
      resolveSubAgentLiveness({
        paused: true,
        lastRoundRunning: true,
        lastRoundDone: false,
        hasError: true,
      }).running,
    ).toBe(false);
  });

  it('is neither running nor done when idle', () => {
    expect(resolveSubAgentLiveness({ paused: false, lastRoundRunning: false, lastRoundDone: false })).toEqual(
      { running: false, done: false },
    );
  });
});

// The in-flight tool action is rendered as the live spinner box AND would appear
// as a static chip in the full group — so its static chip must be skipped to
// avoid the duplicate static+spinner pair (#5428).
describe('inflightToolChipId', () => {
  const LLM = 'llm';

  it('returns the tool action id when the live ref is a tool (skip its static chip)', () => {
    expect(inflightToolChipId({ type: TOOL, id: 'run-1' }, TOOL)).toBe('run-1');
  });

  it('returns null for an LLM ref (the reasoning duplicate is handled elsewhere)', () => {
    expect(inflightToolChipId({ type: LLM, id: 'run-2' }, TOOL)).toBeNull();
  });

  it('returns null when there is no live ref', () => {
    expect(inflightToolChipId(null, TOOL)).toBeNull();
    expect(inflightToolChipId(undefined, TOOL)).toBeNull();
  });

  it('returns null when the tool ref has no id', () => {
    expect(inflightToolChipId({ type: TOOL }, TOOL)).toBeNull();
  });
});

// --- computeBreadcrumbs (#5778 depth-3 per-tier numbering) ------------------ //
//
// Depth-1 (root -> child) keeps today's flat single-level "(N)" ordinal, computed
// entirely in ApplicationThinkView.partitionIntoBlocks — computeBreadcrumbs is
// not even called for those blocks (agentPath.length <= 1), so there is nothing
// to regress here; the tests below just confirm the helper stays out of the way.
// Depth-3 (root -> container -> leaf) needs its OWN per-tier "(n)" disambiguation
// — e.g. two parallel containers of the same name must render "container"
// and "container (2)" even though each hosts only ONE leaf — anchored to each
// tier's call_id (not array position) so the numbering is stable across
// re-renders and between live streaming and reload.

describe('computeBreadcrumb — #5778 depth-3 per-tier numbering', () => {
  it('emits stable labels for depth-1 entries and skips empty paths', () => {
    const entries = [
      { instanceKey: 'cB1', agentPath: [{ name: 'B', call_id: 'cB1' }] },
      { instanceKey: 'cB2', agentPath: [{ name: 'B', call_id: 'cB2' }] },
      { instanceKey: 'noPath', agentPath: [] },
    ];
    const map = computeBreadcrumbs(entries);
    expect(map.get('cB1')).toBe('B (1)');
    expect(map.get('cB2')).toBe('B (2)');
    expect(map.has('noPath')).toBe(false);
  });

  it('disambiguates two parallel same-name containers, each with its own leaf', () => {
    const entries = [
      {
        instanceKey: 'cLeafA',
        agentPath: [
          { name: 'container', call_id: 'cC1' },
          { name: 'leaf', call_id: 'cLeafA' },
        ],
      },
      {
        instanceKey: 'cLeafB',
        agentPath: [
          { name: 'container', call_id: 'cC2' },
          { name: 'leaf', call_id: 'cLeafB' },
        ],
      },
    ];
    const map = computeBreadcrumbs(entries);
    expect(map.get('cLeafA')).toBe('container (1) ▸ leaf');
    expect(map.get('cLeafB')).toBe('container (2) ▸ leaf');
  });

  it('is stable across re-computation and independent of relative block order', () => {
    const containerA = { name: 'container', call_id: 'cC1' };
    const containerB = { name: 'container', call_id: 'cC2' };
    const entries1 = [
      { instanceKey: 'cLeafA', agentPath: [containerA, { name: 'leaf', call_id: 'cLeafA' }] },
      { instanceKey: 'cLeafB', agentPath: [containerB, { name: 'leaf', call_id: 'cLeafB' }] },
    ];
    // Same two blocks, fed in the opposite relative order alongside an unrelated
    // depth-1 block interleaved between them. Call-id ordering is the deterministic
    // compatibility fallback, so relative arrival order cannot change labels.
    const entries2 = [
      { instanceKey: 'cLeafB', agentPath: [containerB, { name: 'leaf', call_id: 'cLeafB' }] },
      { instanceKey: 'unrelated', agentPath: [{ name: 'Other', call_id: 'cOther' }] },
      { instanceKey: 'cLeafA', agentPath: [containerA, { name: 'leaf', call_id: 'cLeafA' }] },
    ];
    const map1 = computeBreadcrumbs(entries1);
    const map2 = computeBreadcrumbs(entries2);
    expect(computeBreadcrumbs(entries1)).toEqual(map1);
    expect(map1.get('cLeafA')).toBe('container (1) ▸ leaf');
    expect(map1.get('cLeafB')).toBe('container (2) ▸ leaf');
    expect(map2.get('cLeafB')).toBe('container (2) ▸ leaf');
    expect(map2.get('cLeafA')).toBe('container (1) ▸ leaf');
  });

  it('combines a depth-1 run and a depth-3 run in one action list without cross-interference', () => {
    const entries = [
      // Depth-1 uses the same breadcrumb contract as deeper paths.
      { instanceKey: 'cB', agentPath: [{ name: 'B', call_id: 'cB' }] },
      // Depth-3: root -> container -> leaf.
      {
        instanceKey: 'cLeaf',
        agentPath: [
          { name: 'container', call_id: 'cC' },
          { name: 'leaf', call_id: 'cLeaf' },
        ],
      },
    ];
    const map = computeBreadcrumbs(entries);
    expect(map.get('cB')).toBe('B');
    // Lone container instance -> no "(n)" suffix (per-tier ">1" guard).
    expect(map.get('cLeaf')).toBe('container ▸ leaf');
  });

  it('uses backend sibling ordinals for same-name invocations', () => {
    const entries = [
      {
        instanceKey: 'b-z',
        agentPath: [{ name: 'B', call_id: 'z', sibling_ordinal: 1 }],
      },
      {
        instanceKey: 'b-a',
        agentPath: [{ name: 'B', call_id: 'a', sibling_ordinal: 2 }],
      },
    ];
    const map = computeBreadcrumbs(entries);
    expect(map.get('b-z')).toBe('B (1)');
    expect(map.get('b-a')).toBe('B (2)');
  });

  it('uses sparse backend ordinals only for ordering and displays contiguous ranks', () => {
    const map = computeBreadcrumbs([
      { instanceKey: 'b1', agentPath: [{ name: 'B', call_id: 'b1', sibling_ordinal: 1 }] },
      { instanceKey: 'b3', agentPath: [{ name: 'B', call_id: 'b3', sibling_ordinal: 3 }] },
    ]);
    expect(map.get('b1')).toBe('B (1)');
    expect(map.get('b3')).toBe('B (2)');
  });

  it('does not number a lone root or any leaf from stale leaf ordinals', () => {
    const map = computeBreadcrumbs([
      {
        instanceKey: 'leaf',
        agentPath: [
          { name: 'Full Name resolver', call_id: 'b1', sibling_ordinal: 2 },
          { name: 'Surname Resolver', call_id: 'c1', sibling_ordinal: 7 },
        ],
      },
    ]);
    expect(map.get('leaf')).toBe('Full Name resolver ▸ Surname Resolver');
  });

  it('numbers only two repeated root suborchestrators and propagates that label to leaves', () => {
    const map = computeBreadcrumbs([
      {
        instanceKey: 'b1',
        agentPath: [{ name: 'Full Name resolver', call_id: 'b1', sibling_ordinal: 1 }],
      },
      {
        instanceKey: 'b1-name',
        agentPath: [
          { name: 'Full Name resolver', call_id: 'b1', sibling_ordinal: 1 },
          { name: 'Name Resolver', call_id: 'n1', sibling_ordinal: 9 },
        ],
      },
      {
        instanceKey: 'b2-name',
        agentPath: [
          { name: 'Full Name resolver', call_id: 'b2', sibling_ordinal: 2 },
          { name: 'Name Resolver', call_id: 'n2', sibling_ordinal: 4 },
        ],
      },
    ]);
    expect(map.get('b1')).toBe('Full Name resolver (1)');
    expect(map.get('b1-name')).toBe('Full Name resolver (1) ▸ Name Resolver');
    expect(map.get('b2-name')).toBe('Full Name resolver (2) ▸ Name Resolver');
  });

  it('keeps a lone pending root numbered from completed sibling trace context', () => {
    const pending = [
      {
        instanceKey: 'b1-name-current',
        agentPath: [
          { name: 'Full Name resolver', call_id: 'b1', sibling_ordinal: 1 },
          { name: 'Name Resolver', call_id: 'n1', sibling_ordinal: 1 },
        ],
      },
    ];
    const traceContext = [
      ...pending,
      {
        instanceKey: 'b2-completed',
        agentPath: [
          { name: 'Full Name resolver', call_id: 'b2', sibling_ordinal: 2 },
          { name: 'Name Resolver', call_id: 'n2', sibling_ordinal: 1 },
        ],
      },
    ];

    const map = computeBreadcrumbs(pending, traceContext);

    expect(map.get('b1-name-current')).toBe('Full Name resolver (1) ▸ Name Resolver');
  });

  it('keeps the second root numbered when it is the only pending sibling', () => {
    const pending = [
      {
        instanceKey: 'b2-name-current',
        agentPath: [
          { name: 'Full Name resolver', call_id: 'b2', sibling_ordinal: 2 },
          { name: 'Name Resolver', call_id: 'n2', sibling_ordinal: 1 },
        ],
      },
    ];
    const map = computeBreadcrumbs(pending, [
      {
        instanceKey: 'b1-completed',
        agentPath: [{ name: 'Full Name resolver', call_id: 'b1', sibling_ordinal: 1 }],
      },
      ...pending,
    ]);

    expect(map.get('b2-name-current')).toBe('Full Name resolver (2) ▸ Name Resolver');
  });

  it('does not number one root repeated across multiple trace paths', () => {
    const pending = [
      {
        instanceKey: 'b1-name-current',
        agentPath: [
          { name: 'Full Name resolver', call_id: 'b1', sibling_ordinal: 1 },
          { name: 'Name Resolver', call_id: 'n1', sibling_ordinal: 1 },
        ],
      },
    ];
    const map = computeBreadcrumbs(pending, [
      ...pending,
      {
        instanceKey: 'b1-surname-trace',
        agentPath: [
          { name: 'Full Name resolver', call_id: 'b1', sibling_ordinal: 1 },
          { name: 'Surname Resolver', call_id: 's1', sibling_ordinal: 2 },
        ],
      },
    ]);

    expect(map.get('b1-name-current')).toBe('Full Name resolver ▸ Name Resolver');
  });
});

describe('selectRichestAgentPath', () => {
  it('prefers complete depth and identity over action arrival order', () => {
    expect(
      selectRichestAgentPath([
        [{ name: 'B', call_id: 'b1' }],
        [
          { name: 'B', call_id: 'b1', sibling_ordinal: 2 },
          { name: 'C', call_id: 'c1' },
        ],
      ]),
    ).toEqual([
      { name: 'B', call_id: 'b1', sibling_ordinal: 2 },
      { name: 'C', call_id: 'c1' },
    ]);
  });
});
