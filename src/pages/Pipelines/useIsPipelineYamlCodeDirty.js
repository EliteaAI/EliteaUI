import { useMemo } from 'react';

import YAML from 'js-yaml';
import { useSelector } from 'react-redux';

import { DumpYamlHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useIsFrom, useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import RouteDefinitions from '@/routes';

export default function useIsPipelineYamlCodeDirty() {
  const isFromPipelineDetail = useIsFromPipelineDetail();
  const isFromChat = useIsFrom(RouteDefinitions.Chat);
  const {
    yamlCode,
    initState: { yamlCode: initYamlCode },
  } = useSelector(state => state.pipeline);
  const reDumpedYamlCode = useMemo(() => {
    let parsedYamlJson = undefined;
    try {
      parsedYamlJson = YAML.load(initYamlCode);
    } catch {
      // YAML parsing failed, parsedYamlJson remains undefined
    }
    return parsedYamlJson ? DumpYamlHelpers.dumpYaml(parsedYamlJson) : '';
  }, [initYamlCode]);

  // Check if we're in a context where pipeline editing is happening:
  // - Pipeline detail pages
  // - OR any chat page (including new conversations without conversationId yet)

  return (isFromPipelineDetail || isFromChat) && yamlCode !== reDumpedYamlCode && yamlCode !== initYamlCode;
}
