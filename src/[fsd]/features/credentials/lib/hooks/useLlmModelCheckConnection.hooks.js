import { useCallback, useRef, useState } from 'react';

import { useTestConfigurationConnectionMutation } from '@/api/configurations';

import { LLM_MODEL_CONFIGURATION_TYPE, LLM_MODEL_STATUS_TONES } from '../constants/llmModelForm.constants.js';
import {
  formatLlmModelConnectionLatency,
  getLlmModelConnectionTestFailureText,
} from '../helpers/llmModelForm.helpers.js';
import { useLlmModelTargetProjectId } from './useLlmModelTargetProjectId.hooks.js';

export const useLlmModelCheckConnection = () => {
  const projectId = useLlmModelTargetProjectId();
  const [testConnection] = useTestConfigurationConnectionMutation();
  const [result, setResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const latestRunRef = useRef(0);

  const startRun = useCallback(() => {
    latestRunRef.current += 1;
    return latestRunRef.current;
  }, []);

  const reset = useCallback(() => {
    startRun();
    setResult(null);
    setIsTesting(false);
  }, [startRun]);

  const showFailure = useCallback(
    text => {
      startRun();
      setIsTesting(false);
      setResult({ tone: LLM_MODEL_STATUS_TONES.error, text });
    },
    [startRun],
  );

  const runTest = useCallback(
    async body => {
      const run = startRun();
      const isCurrentRun = () => run === latestRunRef.current;
      setResult(null);
      setIsTesting(true);
      const startedAt = performance.now();
      try {
        await testConnection({ projectId, configType: LLM_MODEL_CONFIGURATION_TYPE, body }).unwrap();
        if (isCurrentRun()) {
          setResult({
            tone: LLM_MODEL_STATUS_TONES.success,
            text: formatLlmModelConnectionLatency(performance.now() - startedAt),
          });
        }
      } catch (error) {
        if (isCurrentRun()) {
          setResult({
            tone: LLM_MODEL_STATUS_TONES.error,
            text: getLlmModelConnectionTestFailureText(error),
          });
        }
      } finally {
        if (isCurrentRun()) setIsTesting(false);
      }
    },
    [projectId, startRun, testConnection],
  );

  return { result, isTesting, runTest, showFailure, reset };
};
