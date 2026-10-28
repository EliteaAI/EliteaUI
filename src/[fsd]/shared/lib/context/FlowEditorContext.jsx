import React, { memo, useMemo } from 'react';

export const FlowEditorContext = React.createContext();

export const FlowEditorProvider = memo(props => {
  const {
    children,
    setFlowNodes,
    setFlowEdges,
    yamlJsonObject,
    setYamlJsonObject,
    editorWidth,
    editorHeight,
    deleteRunNode,
    isRunningPipeline,
    handleDeleteNode,
    onAddFromHandle,
    expandAll,
    disabled,
    reportNodeIssues,
    onConnectNodes,
    resyncFlowFromYaml,
    registerNodeLeaveGuard,
    requestNodeLeave,
  } = props;

  const contextValue = useMemo(() => {
    return {
      editorHeight,
      editorWidth,
      yamlJsonObject,
      setYamlJsonObject,
      deleteRunNode,
      isRunningPipeline,
      handleDeleteNode,
      onAddFromHandle,
      expandAll,
      setFlowNodes,
      setFlowEdges,
      disabled,
      reportNodeIssues,
      onConnectNodes,
      resyncFlowFromYaml,
      registerNodeLeaveGuard,
      requestNodeLeave,
    };
  }, [
    editorHeight,
    editorWidth,
    yamlJsonObject,
    setYamlJsonObject,
    deleteRunNode,
    isRunningPipeline,
    handleDeleteNode,
    onAddFromHandle,
    expandAll,
    setFlowNodes,
    setFlowEdges,
    disabled,
    reportNodeIssues,
    onConnectNodes,
    resyncFlowFromYaml,
    registerNodeLeaveGuard,
    requestNodeLeave,
  ]);

  return <FlowEditorContext.Provider value={contextValue}>{children}</FlowEditorContext.Provider>;
});

FlowEditorProvider.displayName = 'FlowEditorProvider';

export default FlowEditorProvider;
