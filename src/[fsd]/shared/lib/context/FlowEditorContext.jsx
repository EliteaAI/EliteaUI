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
    handleDuplicateNode,
    onAddFromHandle,
    orientation,
    isCanvasLocked,
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
      handleDuplicateNode,
      onAddFromHandle,
      orientation,
      isCanvasLocked,
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
    handleDuplicateNode,
    onAddFromHandle,
    orientation,
    isCanvasLocked,
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
