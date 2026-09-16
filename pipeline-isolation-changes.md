# Pipeline per-tab isolation — commit message

```
fix: isolate pipeline Redux state per-tab to prevent cross-tab contamination in Canvas

Refactors `state.pipeline` from a flat structure to a per-key map
(`byKey["${projectId}_${pipelineId}"]`). Each Canvas tab writes to and
reads from its own isolated slot via `selectActivePipeline`, so saving
pipeline A and switching to pipeline B no longer overwrites B's flow.
Also fixes empty flow when switching back to an already-loaded tab.

Key changes:
- `pipeline.js`: state is now `{ byKey, activePipelineKey }`. New
  `setActivePipelineKey` / `clearPipelineKey` reducers. `resolveKey`
  fallback to `DEFAULT_PIPELINE_KEY` for non-Canvas pages. `resetFlag=true`
  in `restorePipelineSnapshot` is now safe (per-key isolation).
  `restorePipelineSnapshot` falls back to existing `initState` when
  the snapshot's `initState` is null (tab hidden before data loaded).
- `PipelineEditor.jsx`:
  - `projectId`/`pipelineId`/`pipelineKey`/`pipelineKeyRef` moved before
    all effects that reference them.
  - Added `wasEverVisibleRef` to prevent saving an empty snapshot when a
    tab is hidden before ever becoming visible (Canvas mounts all editors
    at once).
  - Reset effect no longer writes to Redux — removed the race condition
    where the last-mounted inactive tab stole `activePipelineKey`.
  - Visibility effect is now the single owner of `setActivePipelineKey`
    and Redux initialization. On first-time-visible (no snapshot), it
    dispatches `initThePipeline({empty})` to claim the key before
    `versionDetails` arrives. On restore, it dispatches
    `restorePipelineSnapshot`.
  - Store subscription reads from `byKey[key]` directly; falls back to
    `p.nodes` when `pipelineEditor.nodes` is empty (Flow tab never opened).
- All pipeline consumers updated to use `selectActivePipeline` instead of
  `state.pipeline.*` direct reads.
```

## Files changed

| File | Change |
|------|--------|
| `src/slices/pipeline.js` | Flat → per-key `byKey` map; `resolveKey` helper; new `setActivePipelineKey`/`clearPipelineKey` reducers; `selectActivePipeline` selector; `restorePipelineSnapshot` null-initState guard |
| `src/[fsd]/features/chat/ui/editors/PipelineEditor.jsx` | Per-key isolation logic; `wasEverVisibleRef`; visibility effect owns Redux init; store subscription reads per-key; `pipelineKey` added to visibility effect deps (identity-change-while-visible fix); `PipelineAttachmentYamlSync` forwards `isVisible`+`pipelineKey`; `setIsDirtyGuarded` prevents Formik reinit from clearing `isDirty` on hidden tabs; `setIsYamlDirtyGuarded` prevents `useIsPipelineYamlCodeDirty` (reads wrong pipeline via `selectActivePipeline`) from clearing `isYamlDirty` on hidden tabs; `onDirtyStateChange` removed from `BaseEditor` so DirtyDetector cannot call `onPipelineDirtyStateChange(false)` directly, bypassing `totalDirty`; dirty propagation effect gated on `isVisible` |
| `src/[fsd]/features/pipelines/flow-editor/ui/FlowEditor.jsx` | Uses `selectActivePipeline` |
| `src/[fsd]/features/pipelines/yaml-editor/ui/YamlCodeEditor.jsx` | Uses `selectActivePipeline` |
| `src/[fsd]/features/agent/ui/agent-details/configurations/switch/AttachmentSwitch.jsx` | Uses `selectActivePipeline` |
| `src/[fsd]/features/pipelines/lib/hooks/usePipelineAttachmentYamlSync.hooks.js` | Accepts `isVisible`/`pipelineKey` params; reads from `byKey[resolvedKey]` directly; skips dispatch when not visible (cross-tab contamination fix) |
| `src/hooks/pipeline/usePipelineToolsChanges.js` | Uses `selectActivePipeline` |
| `src/pages/Applications/Components/Applications/CreateApplicationTabBar.jsx` | Uses `selectActivePipeline` |
| `src/pages/Applications/Components/Applications/SaveApplicationButton.jsx` | Uses `selectActivePipeline` |
| `src/pages/Pipelines/Components/ChatPanel.jsx` | Uses `selectActivePipeline` |
| `src/pages/Pipelines/Components/ConfigurationTab.jsx` | Removed stale `pipelineId` prop from `EditorPanel` usage |
| `src/pages/Pipelines/EditPipeline.jsx` | `handleDiscard` now calls `setIsYamlDirty(false)` — was missing, leaving nav blocked after discard when YAML had been edited |
| `src/pages/Pipelines/Components/EditorPanel.jsx` | Uses `selectActivePipeline`; removed `key={pipelineId}` from `FlowWrapper` (redundant — `resetFlag` handles re-sync) |
| `src/pages/Pipelines/useIsPipelineYamlCodeDirty.js` | Uses `selectActivePipeline` |
| `src/pages/Pipelines/useSavePipeline.js` | Uses `selectActivePipeline` |

## Nav-blocking design (Canvas multi-tab)

Three layers cooperate to keep the unsaved-changes warning active on hidden Canvas tabs:

1. **`setIsDirtyGuarded`** — passed as `setIsDirty` to `BaseEditor`. Suppresses `false` writes while the tab is hidden. Blocks the Formik reinit path: when `isVisible=false` the RTK Query `skip` makes `versionDetails=undefined` → `initialValues` changes → `enableReinitialize` resets the form → `DirtyDetector` fires `false` — suppressed.

2. **`setIsYamlDirtyGuarded`** — passed as `setYamlDirty` to `EditorPanel`. Suppresses `false` writes while hidden. Blocks the YAML dirty path: `useIsPipelineYamlCodeDirty` reads `selectActivePipeline`, which now reflects the other (active) tab's key → returns `false` → `EditorPanel` calls `setYamlDirty(false)` — suppressed.

3. **`onDirtyStateChange` removed from `BaseEditor`** — prevents `DirtyDetector` from calling `onPipelineDirtyStateChange(false)` directly via `BaseEditor`'s `handleIsDirtyChange`, which would bypass `totalDirty` and the `isVisible` guard entirely. All propagation to the parent goes through the `totalDirty` effect, which is gated on `isVisible`.
