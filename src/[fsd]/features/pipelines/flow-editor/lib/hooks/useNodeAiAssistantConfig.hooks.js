import { useMemo } from 'react';

import { useFormikContext } from 'formik';

export const useNodeAiAssistantConfig = () => {
  const { values: formikValues } = useFormikContext();

  const pipelineLLMConfig = useMemo(
    () => formikValues?.version_details?.llm_settings || null,
    [formikValues?.version_details?.llm_settings],
  );

  return pipelineLLMConfig;
};
