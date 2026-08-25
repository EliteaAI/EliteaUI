import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useMcpAuthModal } from '@/[fsd]/features/mcp';
import { ToolkitChatModesEnum } from '@/[fsd]/features/toolkits/lib/constants';
import { ToolkitChatHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useGetSelectedToolSchema } from '@/hooks/toolkit/useGetSelectedToolSchema';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

import { useToolkitChat } from './useToolkitChat.hooks';

const TEST_TOOLS_MODES = [ToolkitChatModesEnum.testTools];

const resolveSchemaDefault = property => {
  if (property.default !== undefined) return property.default;

  if (Array.isArray(property.anyOf)) {
    const arrayVariant = property.anyOf.find(variant => variant.type === 'array');
    if (arrayVariant?.default !== undefined) return arrayVariant.default;
    if (property.anyOf.some(variant => variant.type === 'null')) return null;
  }

  switch (property.type) {
    case 'object':
      return {};
    case 'array':
      return [];
    case 'boolean':
      return false;
    case 'number':
    case 'integer':
      return null;
    default:
      return '';
  }
};

const seedMissingDefaults = (current, properties) => {
  const seeded = Object.entries(properties).reduce((acc, [key, property]) => {
    const value = current?.[key];
    // A function value comes from the schema itself, not the user, so it still needs a default.
    const isFilledByUser = value !== undefined && value !== '' && typeof value !== 'function';

    if (!isFilledByUser) acc[key] = resolveSchemaDefault(property);
    return acc;
  }, {});

  return Object.keys(seeded).length ? { ...current, ...seeded } : current;
};

/**
 * Drives a toolkit tool run: tool selection, parameter state, schema resolution and the chat socket.
 * Takes `values` rather than reading Formik so it stays usable outside a form provider.
 *
 * Passing `index` makes the chat hook prefix every tool param set with that index's collection.
 * `adjustSchema` must be a stable reference, or the parameter form remounts on every render.
 */
export const useToolkitTestRunner = ({ toolkitId, values, index, adjustSchema }) => {
  const initializedToolRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolInputVariables, setToolInputVariables] = useState({});

  // Stable ref wrapper to break the circular dependency between useToolkitChat and useMcpAuthModal.
  const mcpAuthRequiredRef = useRef(null);
  const onMcpAuthRequiredStable = useCallback(message => {
    mcpAuthRequiredRef.current?.(message);
  }, []);

  const resolvedToolSchema = useGetSelectedToolSchema({
    toolkitType: values?.type,
    toolOptionType: selectedTool,
    toolkitId,
    availableMcpTools: values?.settings?.available_mcp_tools,
  });

  const selectedToolSchema = useMemo(
    () => (adjustSchema && resolvedToolSchema ? adjustSchema(resolvedToolSchema) : resolvedToolSchema),
    [adjustSchema, resolvedToolSchema],
  );

  const isValidForm = useMemo(() => {
    if (values?.type === ToolTypes.custom.value) return true;
    if (!selectedTool || !selectedToolSchema?.properties) return false;

    return ToolkitChatHelpers.validateToolkitForm(selectedToolSchema, toolInputVariables);
  }, [selectedTool, toolInputVariables, selectedToolSchema, values?.type]);

  const {
    chatHistory,
    handleRunTool,
    handleClearChat,
    handleClearActiveConversation,
    isRunning,
    retryLastRun,
    modelList,
    onSelectModel,
    onSetLLMSettings,
    selectedModel,
    llmSettings,
  } = useToolkitChat({
    index,
    runTool: selectedTool,
    toolInputVariables,
    toolkitId,
    isValidForm,
    values,
    modes: TEST_TOOLS_MODES,
    onMcpAuthRequired: onMcpAuthRequiredStable,
  });

  // Must be declared after useToolkitChat, which supplies the retry it runs on success.
  const { handleMcpAuthRequired, getModalProps } = useMcpAuthModal({
    values,
    onSuccess: retryLastRun,
    showSuccessToast: false,
  });

  // Assigned during render on purpose: an authorization message arriving before an effect could
  // flush would otherwise be dropped and the modal would never open.
  mcpAuthRequiredRef.current = handleMcpAuthRequired;

  const onChangeInputVariables = useCallback(inputVariables => {
    setToolInputVariables(inputVariables);
  }, []);

  const onChangeTool = useCallback(
    value => {
      // Released so re-picking the tool that was just cleared seeds its defaults again.
      initializedToolRef.current = null;
      setSelectedTool(value || null);
      setToolInputVariables({});
      handleClearChat();
      handleClearActiveConversation();
    },
    [handleClearChat, handleClearActiveConversation],
  );

  useEffect(() => {
    if (!selectedTool || !selectedToolSchema?.properties) return;
    if (initializedToolRef.current === selectedTool) return;

    initializedToolRef.current = selectedTool;

    setToolInputVariables(current => seedMissingDefaults(current, selectedToolSchema.properties));
  }, [selectedTool, selectedToolSchema?.properties]);

  const mcpAuthModalProps = getModalProps();

  return {
    selectedTool,
    onChangeTool,
    toolInputVariables,
    onChangeInputVariables,
    selectedToolSchema,
    isValidForm,
    chatHistory,
    isRunning,
    handleRunTool,
    modelList,
    selectedModel,
    onSelectModel,
    llmSettings,
    onSetLLMSettings,
    mcpAuthModalProps,
  };
};
