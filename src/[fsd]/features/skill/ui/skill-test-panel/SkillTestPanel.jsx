import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, IconButton, InputBase, Typography } from '@mui/material';

import { useSkillTestChat } from '@/[fsd]/features/skill/lib/hooks';
import { generateLLMSettings } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import { Markdown } from '@/[fsd]/shared/ui';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import { useListModelsQuery } from '@/api';
import SendIcon from '@/components/Icons/SendIcon';
import RotatingMessages from '@/components/RotatingMessages';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const SkillTestPanel = memo(() => {
  const { values } = useFormikContext();
  const { toastError } = useToast();
  const projectId = useSelectedProjectId();
  const messagesEndRef = useRef(null);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [llmSettings, setLlmSettings] = useState(() => generateLLMSettings());

  const styles = skillTestPanelStyles();

  const { data: modelsData } = useListModelsQuery(
    { projectId, include_shared: true, section: 'llm' },
    { skip: !projectId },
  );
  const models = useMemo(() => modelsData?.items || [], [modelsData?.items]);

  const instructions = values?.version_details?.instructions || '';

  const { messages, isStreaming, send } = useSkillTestChat({
    projectId,
    instructions,
    selectedModel,
    llmSettings,
  });

  useEffect(() => {
    if (selectedModel || !models.length) return;
    const defaultName = modelsData?.default_model_name;
    const defaultProjectId = modelsData?.default_model_project_id;
    const match =
      (defaultName &&
        models.find(
          m => m.name === defaultName && (!defaultProjectId || m.project_id === defaultProjectId),
        )) ||
      models[0];
    setSelectedModel(match);
  }, [models, modelsData?.default_model_name, modelsData?.default_model_project_id, selectedModel]);

  useEffect(() => {
    if (!selectedModel) return;
    setLlmSettings(prev => generateLLMSettings(selectedModel, prev));
  }, [selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const onSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    if (!selectedModel) {
      toastError('No model is available');
      return;
    }
    setInput('');
    send(text).catch(() => {
      toastError('Failed to start the test run. Please retry in a moment.');
    });
  }, [input, isStreaming, selectedModel, send, toastError]);

  const onKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend],
  );

  return (
    <Box sx={styles.root}>
      <Box sx={styles.messages}>
        {messages.length === 0 ? (
          <Typography
            variant="bodyMedium"
            sx={styles.emptyState}
          >
            Type a message below to test the selected version&apos;s instructions.
          </Typography>
        ) : (
          messages.map(m =>
            m.role === 'user' ? (
              <Box
                key={m.id}
                sx={styles.userMessage}
              >
                <Typography variant="bodyMedium">{m.content}</Typography>
              </Box>
            ) : (
              <Box
                key={m.id}
                sx={m.error ? styles.errorMessage : styles.assistantMessage}
              >
                {m.content ? (
                  <Markdown>{m.content}</Markdown>
                ) : isStreaming ? (
                  <RotatingMessages sx={styles.thinking} />
                ) : (
                  <Typography
                    variant="bodyMedium"
                    sx={styles.thinking}
                  >
                    No response.
                  </Typography>
                )}
              </Box>
            ),
          )
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={styles.inputRow}>
        <InputBase
          fullWidth
          multiline
          maxRows={6}
          placeholder="Type your message."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          sx={styles.input}
        />
        <Box sx={styles.inputActions}>
          <LLMModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            models={models}
            llmSettings={llmSettings}
            onSetLLMSettings={setLlmSettings}
            showStepsLimit={false}
            showWebhookSecret={false}
          />
          <IconButton
            color="primary"
            disabled={isStreaming || !input.trim()}
            onClick={onSend}
            sx={styles.sendButton}
            aria-label="Send test message"
          >
            <SendIcon sx={styles.sendIcon} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
});

SkillTestPanel.displayName = 'SkillTestPanel';

/** @type {MuiSx} */
const skillTestPanelStyles = () => ({
  root: ({ palette }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    backgroundColor: palette.background.tabPanel,
    overflow: 'hidden',
  }),
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  emptyState: ({ palette }) => ({
    color: palette.text.metrics,
    fontStyle: 'italic',
    margin: 'auto',
    textAlign: 'center',
  }),
  thinking: {
    color: 'text.metrics',
  },
  userMessage: ({ palette }) => ({
    alignSelf: 'flex-end',
    maxWidth: '85%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
  }),
  assistantMessage: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    width: '100%',
  },
  errorMessage: ({ palette }) => ({
    alignSelf: 'flex-start',
    maxWidth: '100%',
    width: '100%',
    color: palette.error.main,
  }),
  inputRow: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    borderTop: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
    flexShrink: 0,
  }),
  input: {
    width: '100%',
  },
  inputActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  sendButton: ({ palette }) => ({
    backgroundColor: palette.background.button?.primary?.default || palette.primary.main,
    width: '2rem',
    height: '2rem',
    '&:hover': {
      backgroundColor: palette.background.button?.primary?.hover || palette.primary.dark,
    },
  }),
  sendIcon: {
    fontSize: '1rem',
    width: '1rem',
    height: '1rem',
  },
});

export default SkillTestPanel;
