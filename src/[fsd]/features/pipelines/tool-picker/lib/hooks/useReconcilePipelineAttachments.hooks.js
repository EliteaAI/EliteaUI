import { useEffect, useMemo } from 'react';

import { useFormikContext } from 'formik';
import YAML from 'js-yaml';
import { useSelector } from 'react-redux';

import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks/useGetToolkitNameFromSchema.hooks';
import { reconcileAttachments } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentReconcile.helpers';
import { selectActivePipeline } from '@/slices/pipeline';

// The flow-editor hook by file: the flow-editor barrels reach the node components, which import this slice

const parseYaml = yamlCode => {
  try {
    return YAML.load(yamlCode || '') || {};
  } catch {
    return null;
  }
};

/**
 * Keeps `version_details.tools` in line with the nodes after every YAML change (node delete, tool change,
 * YAML edit). Call it once per editor.
 */
export const useReconcilePipelineAttachments = ({ yamlJsonObject, enabled = true }) => {
  const { values, initialValues, setFieldValue } = useFormikContext();
  const { initState } = useSelector(selectActivePipeline);
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();

  const initialInstructions = initialValues?.version_details?.instructions || '';
  const initialYamlJsonObject = useMemo(() => parseYaml(initialInstructions), [initialInstructions]);
  // The canvas still shows another pipeline (navigation, Canvas tab switch) until both baselines agree
  const isCanvasOfThisForm = (initState?.yamlCode || '') === initialInstructions;

  const tools = values?.version_details?.tools;
  const initialTools = initialValues?.version_details?.tools;

  useEffect(() => {
    if (!enabled || !isCanvasOfThisForm || !initialYamlJsonObject || !Array.isArray(tools)) return;
    const nextTools = reconcileAttachments({
      tools,
      initialTools,
      yamlJsonObject,
      initialYamlJsonObject,
      getToolkitName: getToolkitNameFromSchema,
    });
    if (nextTools !== tools) setFieldValue('version_details.tools', nextTools);
  }, [
    enabled,
    getToolkitNameFromSchema,
    initialTools,
    initialYamlJsonObject,
    isCanvasOfThisForm,
    setFieldValue,
    tools,
    yamlJsonObject,
  ]);
};
