// Fallback Redux key used by non-Canvas pages (EditPipeline, ConfigurationTab) that
// never call setActivePipelineKey. Only one pipeline is active at a time on those pages,
// so sharing a single slot is safe.
export const DEFAULT_PIPELINE_KEY = '__default__';
