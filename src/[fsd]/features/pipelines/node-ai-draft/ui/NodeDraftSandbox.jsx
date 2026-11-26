import { memo, useCallback, useContext, useMemo, useRef } from 'react';

import { Formik, useFormikContext } from 'formik';

import { FlowEditorContext, NodeConfigPanelContext } from '@/[fsd]/shared/lib/context';
import { ReactFlowProvider } from '@xyflow/react';

import SandboxToolsWatcher from './SandboxToolsWatcher';

const noop = () => {};
const PANEL_CONTEXT = { isEntrypoint: false, isLegacyLayout: false };

/**
 * Renders the node's own panel component on a draft without touching the pipeline (spec AC-12, plan R4).
 * The component sees the real pipeline with the draft in its slot; every YAML write lands in `onChange`,
 * canvas writes are dropped, and attachment pickers write a nested Formik that is reported by `onToolsChange`.
 */
const NodeDraftSandbox = memo(props => {
  const { node, pipeline, NodeComponent, onChange, tools, onToolsChange, disabled = false } = props;
  const outer = useContext(FlowEditorContext);
  const { values: outerValues } = useFormikContext();

  const sandboxYaml = useMemo(
    () => ({
      ...pipeline,
      nodes: (pipeline?.nodes || []).map(item => (item.id === node.id ? node : item)),
    }),
    [pipeline, node],
  );

  // Node components write with a value or an updater, like the real setter
  const sandboxYamlRef = useRef(sandboxYaml);
  sandboxYamlRef.current = sandboxYaml;
  const setYamlJsonObject = useCallback(
    next => {
      const value = typeof next === 'function' ? next(sandboxYamlRef.current) : next;
      const drafted = value?.nodes?.find(item => item.id === node.id);
      if (drafted) onChange?.(drafted);
    },
    [node.id, onChange],
  );

  const contextValue = useMemo(
    () => ({
      ...outer,
      yamlJsonObject: sandboxYaml,
      setYamlJsonObject,
      setFlowNodes: noop,
      setFlowEdges: noop,
      onConnectNodes: noop,
      reportNodeIssues: noop,
      resyncFlowFromYaml: noop,
      handleDeleteNode: undefined,
      handleDuplicateNode: undefined,
      isRunningPipeline: false,
      disabled,
    }),
    [outer, sandboxYaml, setYamlJsonObject, disabled],
  );

  // A snapshot: picks inside the sandbox must not reach the pipeline's Formik until Apply. It starts from the
  // tools already picked for this draft, so switching to YAML and back keeps them.
  const initialValues = useMemo(
    () => ({
      ...outerValues,
      version_details: {
        ...outerValues?.version_details,
        tools: tools || outerValues?.version_details?.tools,
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={noop}
    >
      <ReactFlowProvider>
        <FlowEditorContext.Provider value={contextValue}>
          <NodeConfigPanelContext.Provider value={PANEL_CONTEXT}>
            <SandboxToolsWatcher onToolsChange={onToolsChange} />
            {NodeComponent && (
              <NodeComponent
                id={node.id}
                type={node.type}
                data={{}}
                selected={false}
              />
            )}
          </NodeConfigPanelContext.Provider>
        </FlowEditorContext.Provider>
      </ReactFlowProvider>
    </Formik>
  );
});

NodeDraftSandbox.displayName = 'NodeDraftSandbox';

export default NodeDraftSandbox;
