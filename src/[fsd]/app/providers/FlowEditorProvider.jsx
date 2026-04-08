import React, { useMemo } from 'react';

export const FlowEditorContext = React.createContext();

export const FlowEditorProvider = props => {
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
    expandAll,
    disabled,
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
      expandAll,
      setFlowNodes,
      setFlowEdges,
      disabled,
    };
  }, [
    editorHeight,
    editorWidth,
    yamlJsonObject,
    setYamlJsonObject,
    deleteRunNode,
    isRunningPipeline,
    handleDeleteNode,
    expandAll,
    setFlowNodes,
    setFlowEdges,
    disabled,
  ]);

  return <FlowEditorContext.Provider value={contextValue}>{children}</FlowEditorContext.Provider>;
};
