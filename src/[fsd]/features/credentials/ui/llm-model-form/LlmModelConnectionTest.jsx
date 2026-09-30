import { memo, useCallback, useEffect, useMemo } from 'react';

import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { LlmModelFormConstants } from '../../lib/constants';
import { credentialKeyOf } from '../../lib/helpers/apiProtocol.helpers.js';
import {
  buildLlmModelConnectionTestBody,
  getLlmModelConnectionTestMissingFields,
  getLlmModelConnectionTestMissingFieldsText,
} from '../../lib/helpers/llmModelForm.helpers.js';
import { useLlmModelCheckConnection } from '../../lib/hooks';
import LlmModelStatusLine from './LlmModelStatusLine';

const { LLM_MODEL_CONNECTION_TEST_TEXTS: TEXTS } = LlmModelFormConstants;

const LlmModelConnectionTest = memo(props => {
  const { settings, isApiProtocolShown, apiProtocol, isCredentialTypePending, rejectionBeforeRequest } =
    props;
  const styles = llmModelConnectionTestStyles();
  const { result, isTesting, runTest, showFailure, reset } = useLlmModelCheckConnection();

  const missingFields = useMemo(
    () => getLlmModelConnectionTestMissingFields({ settings, isApiProtocolShown, apiProtocol }),
    [settings, isApiProtocolShown, apiProtocol],
  );
  const disabledReason = useMemo(() => {
    if (missingFields.length) return getLlmModelConnectionTestMissingFieldsText(missingFields);
    if (isCredentialTypePending) return TEXTS.credentialsTypePending;
    return '';
  }, [missingFields, isCredentialTypePending]);

  const credentialKey = credentialKeyOf(settings.ai_credentials);
  useEffect(() => {
    reset();
  }, [credentialKey, settings.name, apiProtocol, settings.supports_reasoning, reset]);

  const onTest = useCallback(() => {
    if (rejectionBeforeRequest) {
      showFailure(rejectionBeforeRequest);
      return;
    }
    runTest(buildLlmModelConnectionTestBody({ settings, isApiProtocolShown, apiProtocol }));
  }, [rejectionBeforeRequest, showFailure, runTest, settings, isApiProtocolShown, apiProtocol]);

  return (
    <Box
      sx={styles.container}
      data-testid="llm-model-connection-test"
    >
      <Tooltip
        title={disabledReason}
        placement="top"
      >
        <Box
          component="span"
          sx={styles.buttonWrapper}
          data-testid="llm-model-test-connection-tooltip-target"
        >
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={onTest}
            disabled={Boolean(disabledReason)}
            loading={isTesting}
            data-testid="llm-model-test-connection"
          >
            {TEXTS.button}
          </Button.BaseBtn>
        </Box>
      </Tooltip>
      {result && (
        <LlmModelStatusLine
          status={result}
          testId="llm-model-connection-test-result"
        />
      )}
    </Box>
  );
});

LlmModelConnectionTest.displayName = 'LlmModelConnectionTest';

/** @type {MuiSx} */
const llmModelConnectionTestStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  buttonWrapper: {
    display: 'inline-flex',
  },
});

export default LlmModelConnectionTest;
