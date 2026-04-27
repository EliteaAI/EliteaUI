import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import { Box, Typography } from '@mui/material';

import { NewConversationHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { DEFAULT_STEPS_LIMIT } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import { cleanLLMSettings, generateLLMSettings } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import { useConversationEditMutation, useUpdateParticipantLlmSettingsMutation } from '@/api/chat';
import { useListModelsQuery } from '@/api/configurations.js';
import WelcomeImage from '@/assets/chat-welcome.png';
import {
  ChatParticipantType,
  ConversationNameRegExp,
  ConversationNameWarningMessage,
  DefaultConversationName,
  PUBLIC_PROJECT_ID,
  sioEvents,
} from '@/common/constants';
import { initializeNewMessages } from '@/common/initializeNewMessages';
import { generateMessagePayload } from '@/common/messagePayloadUtils';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import { EllipsisTextWithTooltip } from '@/components/ConversationStarters';
import useValidateApplicationVersion, {
  useToolsValidationInfo,
} from '@/hooks/application/useValidateApplicationVersion';
import useValidateToolkit, { useToolkitValidationInfo } from '@/hooks/application/useValidateToolkit';
import useChatStreaming from '@/hooks/chat/useChatStreaming';
import useFetchParticipantDetails from '@/hooks/chat/useFetchParticipantDetails';
import { useNewStartConversationInputKeyDownHandler } from '@/hooks/chat/useInputKeyDownHandler';
import useLocalActiveParticipant from '@/hooks/chat/useLocalActiveParticipant';
import useNewConversationAttachments from '@/hooks/chat/useNewConversationAttachments';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSocket from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';
import { actions } from '@/slices/chat';

import NewChatInput from './NewChatInput';
import RecommendationList from './Recommendations/RecommendationList';
import SearchResultList from './Recommendations/SearchResultList';

const NewConversationView = forwardRef(
  (
    {
      addNewParticipants,
      onCreateConversation,
      activeConversation,
      setActiveConversation,
      setActiveParticipant,
      activeParticipant,
      setChatHistory,
      interaction_uuid,
      onShowAgentEditor,
      onShowPipelineEditor,
      onCloseAgentEditor,
      hidden = false,
      uploadAttachments,
      isUploadingAttachments,
      uploadProgress,
      setNewConversationQuestion,
    },
    ref,
  ) => {
    const styles = newConversationViewStyles();
    const selectedProjectId = useSelectedProjectId();
    const { toastSuccess } = useToast();
    const systemSenderName = useSystemSenderName();
    const { selectedAgent, selectedAgentStarter } = useSelector(state => state.chat);
    const dispatch = useDispatch();
    const user = useSelector(state => state.user);
    const userName = useMemo(() => {
      const fullName = user.name || NewConversationHelpers.extractHumanReadableName(user.email) || 'there';
      return NewConversationHelpers.extractFirstName(fullName);
    }, [user.email, user.name]);
    const chatInput = useRef(null);
    const { setLocalActiveParticipant } = useLocalActiveParticipant();
    const [selectedParticipants, setSelectedParticipants] = useState(activeConversation?.participants || []);
    const [selectedParticipant, setSelectedParticipant] = useState(activeParticipant || null);
    const [selectedParticipantDetails, setSelectedParticipantDetails] = useState(activeParticipant || null);
    const [prevConversation, setPrevConversation] = useState(activeConversation);
    const [internalTools, setInternalTools] = useState([]);
    const [showRecommendationList, setShowRecommendationList] = useState(false);
    const { data: modelsData = { items: [], total: 0 } } = useListModelsQuery(
      { projectId: selectedProjectId, include_shared: true },
      { skip: !selectedProjectId },
    );
    const [selectedModel, setSelectedModel] = useState(null);
    const [prevSelectedModel, setPrevSelectedModel] = useState(null);
    const [updateChatLlmSettings] = useUpdateParticipantLlmSettingsMutation();
    const [conversationEditMeta] = useConversationEditMutation();
    const { attachments, disableAttachments, onAttachFiles, onDeleteAttachment, onClearAttachments } =
      useNewConversationAttachments({ selectedParticipant });

    // Create LLM settings for conversation pages from user settings
    const [llmSettings, setLlmSettings] = useState({
      ...generateLLMSettings(null), // No model selected yet
      steps_limit: DEFAULT_STEPS_LIMIT,
    });

    const onSetLLMSettings = useCallback(
      newSettings => {
        setLlmSettings(prev => ({
          ...prev,
          ...newSettings,
        }));
      },
      [setLlmSettings],
    );

    const onInternalToolsConfigChange = useCallback(
      ({ key, value }) => {
        setInternalTools(prev => {
          const newTools = new Set(prev);
          if (value) {
            newTools.add(key);
          } else {
            newTools.delete(key);
          }
          toastSuccess('Internal tools configuration updated');
          return Array.from(newTools);
        });
      },
      [toastSuccess],
    );

    const defaultModel = useMemo(() => {
      return modelsData.items.find(model => model.default) || modelsData.items[0] || null;
    }, [modelsData.items]);

    useEffect(() => {
      setSelectedModel(defaultModel);
      setPrevSelectedModel(defaultModel);
    }, [defaultModel]);

    const { emit } = useSocket(sioEvents.chat_predict);
    const getPayload = useCallback(
      ({ question, question_id, participant, conversationUuid, attachmentList }) => {
        return generateMessagePayload({
          question,
          question_id,
          participant,
          conversation_uuid: conversationUuid || activeConversation.uuid,
          projectId: selectedProjectId,
          interaction_uuid,
          selectedModel,
          attachmentList,
          participants: activeConversation.participants || [],
        });
      },
      [
        activeConversation.uuid,
        activeConversation.participants,
        interaction_uuid,
        selectedModel,
        selectedProjectId,
      ],
    );
    const { setConversationStreamingInfo } = useChatStreaming({ chatHistory: [] });

    const onPredictStream = useCallback(
      (question, specifiedParticipant, conversation) => {
        // Guard: ensure conversation and uuid exist before emitting
        const conversationUuid = conversation?.uuid;
        if (!conversationUuid) {
          setActiveConversation(prev => ({
            ...prev,
            isSending: undefined,
          }));
          return;
        }

        const emitEvent = async (uuid, participant) => {
          const question_id = uuidv4();
          let newMessages = initializeNewMessages({
            question,
            question_id,
            participant,
            userId: user.id,
            name: user.name,
            avatar: user.avatar,
          });

          const { success, messages, updatedAttachments } = await uploadAttachments({
            attachments,
            conversationId: conversation?.id || '',
            messages: newMessages,
          });
          if (success) {
            newMessages = messages;
          } else {
            setActiveConversation(prev => ({
              ...prev,
              isSending: undefined,
            }));
            return;
          }

          setChatHistory(prevMessages => [...prevMessages, ...newMessages]);

          setConversationStreamingInfo(uuid, question_id);
          // Use sanitized filenames from upload response to match what's stored in MinIO
          const payload = getPayload({
            question,
            participant,
            question_id,
            conversationUuid: uuid,
            attachmentList: updatedAttachments || attachments,
          });
          emit(payload);
          onClearAttachments?.();
          setActiveConversation(prev => ({
            ...prev,
            isSending: undefined,
          }));
        };
        dispatch(actions.setIsCreatingNewConversation(false));
        emitEvent(conversationUuid, specifiedParticipant);
      },
      [
        attachments,
        setChatHistory,
        setConversationStreamingInfo,
        getPayload,
        emit,
        user.name,
        user.avatar,
        user.id,
        uploadAttachments,
        onClearAttachments,
        setActiveConversation,
        dispatch,
      ],
    );
    const onPredictStreamRef = useRef(onPredictStream);
    useEffect(() => {
      onPredictStreamRef.current = onPredictStream;
    }, [onPredictStream]);

    const [isSending, setIsSending] = useState(false);

    const { fetchOriginalDetails, isFetchingParticipant, fetchOriginalVersionDetails } =
      useFetchParticipantDetails();
    const activeConversationRef = useRef(activeConversation);
    const isConversationNameInvalid = useMemo(
      () => activeConversation?.name && !ConversationNameRegExp.test(activeConversation.name),
      [activeConversation?.name],
    );

    useValidateApplicationVersion(
      (selectedParticipant?.entity_name === ChatParticipantType.Applications ||
        selectedParticipant?.entity_name === ChatParticipantType.Pipelines) &&
        selectedParticipant?.version_details?.tools
        ? {
            applicationId: selectedParticipant?.id,
            projectId: selectedParticipant?.project_id,
            versionId: selectedParticipant?.entity_settings?.version_id,
          }
        : {},
    );

    const { totalValidationInfo } = useToolsValidationInfo({
      applicationId: selectedParticipant?.id,
      projectId: selectedParticipant?.project_id,
      versionId: selectedParticipant?.entity_settings?.version_id,
      tools: selectedParticipant?.version_details?.tools || [],
    });

    useValidateToolkit(
      selectedParticipant?.entity_name === ChatParticipantType.Toolkits
        ? {
            toolkitId: selectedParticipant?.id,
            projectId: selectedParticipant?.project_id,
            forceSkip: selectedParticipant?.entity_name !== ChatParticipantType.Toolkits,
          }
        : {},
    );

    const { toolkitValidationInfoList } = useToolkitValidationInfo(
      selectedParticipant?.entity_name === ChatParticipantType.Toolkits
        ? {
            projectId: selectedParticipant?.project_id,
            toolkitId: selectedParticipant?.id,
          }
        : {},
    );

    useEffect(() => {
      activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    const { onKeyDown, query, stopProcessingSymbols, isProcessingSymbols } =
      useNewStartConversationInputKeyDownHandler();

    const onClearSelectedParticipant = useCallback(() => {
      setSelectedParticipant(null);
      setSelectedParticipantDetails(null);
      setActiveParticipant();
    }, [setActiveParticipant]);

    useEffect(() => {
      if (prevConversation?.uuid && activeConversation?.isNew) {
        onClearSelectedParticipant();
      }
      setPrevConversation(activeConversation);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeConversation?.isNew, onClearSelectedParticipant]);

    useEffect(() => {
      if (activeConversation?.isNew) chatInput.current?.focus?.();
    }, [activeConversation?.isNew]);

    const onShowParticipantsList = useCallback(() => {
      setShowRecommendationList(prev => !prev);
      stopProcessingSymbols();
    }, [stopProcessingSymbols]);

    useEffect(() => {
      selectedParticipants?.length &&
        setActiveConversation(prev => {
          return prev.isNew
            ? {
                ...prev,
                participants: [...selectedParticipants],
              }
            : prev;
        });
    }, [selectedParticipants, setActiveConversation]);

    const convertParticipantAndAddIt = useCallback(
      ({ participant, details }) => {
        if (Object.keys(details).length) {
          // Fix for issue #2948: Use optional chaining to prevent TypeError when
          // participant.meta is undefined (e.g., when selecting from recommendations)
          const transformedParticipant = participant.meta?.added_from_agent
            ? participant
            : {
                ...participant,
                ...details,
                entity_name: participant.participantType,
                entity_meta: { id: participant.id, project_id: participant.project_id || selectedProjectId },
                entity_settings:
                  participant.participantType === ChatParticipantType.Toolkits
                    ? {
                        icon_meta: details.icon_meta,
                        toolkit_type: details.type,
                      }
                    : {
                        // Fix for issue #2948: Use optional chaining to prevent TypeError when
                        // details.version_details is undefined
                        agent_type: details.version_details?.agent_type,
                        llm_settings: details.version_details?.llm_settings || {},
                        variables: details.version_details?.variables || [],
                        version_id: details.version_details?.id,
                      },
                meta: { name: participant.name, mcp: details.meta?.mcp },
                // Store the original latest version ID for comparison later
                originalLatestVersionId: details.version_details?.id,
              };
          if (participant.participantType !== ChatParticipantType.Toolkits) {
            setSelectedParticipant(transformedParticipant);
            setSelectedParticipantDetails(details);
            setActiveParticipant(transformedParticipant);
          }
          setSelectedParticipants(prev => {
            if (
              prev.find(
                p =>
                  p.entity_name === transformedParticipant.participantType &&
                  p.entity_meta.id === participant.id,
              )
            ) {
              return prev.map(p =>
                p.entity_name === transformedParticipant.participantType &&
                p.entity_meta.id === participant.id
                  ? { ...transformedParticipant }
                  : p,
              );
            }
            return [...prev, transformedParticipant];
          });
        }
      },
      [setActiveParticipant, selectedProjectId],
    );

    const onSelectParticipant = async participant => {
      if (isFetchingParticipant) return;
      if (!participant) {
        setSelectedParticipant(null);
        setActiveParticipant();
        return;
      }

      if (isProcessingSymbols) {
        stopProcessingSymbols();
        chatInput.current?.reset();
      }

      const details =
        participant.version_details || participant.participantType === ChatParticipantType.Toolkits
          ? participant
          : await fetchOriginalDetails(participant.participantType, participant.id, participant.project_id);

      convertParticipantAndAddIt({ participant, details });
      setTimeout(() => {
        chatInput.current?.removeSymbol(query);
      }, 0);
    };

    useImperativeHandle(ref, () => ({
      onSelectParticipant,
      onDeleteParticipant: participantToDelete => {
        if (
          selectedParticipant?.entity_name === participantToDelete.entity_name &&
          selectedParticipant?.entity_meta.id === participantToDelete.entity_meta.id
        ) {
          onClearSelectedParticipant();
        }
        setSelectedParticipants(prev =>
          prev.filter(
            p =>
              p.entity_name !== participantToDelete.entity_name ||
              p.entity_meta.id !== participantToDelete.entity_meta.id,
          ),
        );
      },
    }));

    const conversationStarters = useMemo(() => {
      return selectedParticipant?.version_details?.conversation_starters || [];
    }, [selectedParticipant]);

    const onSelectModel = useCallback(
      newModel => {
        onClearSelectedParticipant();
        setShowRecommendationList(false);
        setSelectedModel(newModel);
        setPrevSelectedModel(newModel);
      },
      [onClearSelectedParticipant],
    );

    const onSelectVersion = useCallback(
      async version => {
        const versionDetails = await fetchOriginalVersionDetails(
          selectedParticipant?.participantType,
          selectedParticipant?.id,
          version.id,
          selectedParticipant?.project_id || selectedProjectId,
        );
        const updatedParticipant = {
          ...(selectedParticipant || {}),
          version_details: {
            ...(versionDetails || selectedParticipant.version_details || {}),
          },
          entity_settings: {
            ...(selectedParticipant?.entity_settings || {}),
            version_id: version.id,
            // Update version-specific settings from the selected version
            ...(versionDetails?.llm_settings && { llm_settings: versionDetails.llm_settings }),
            ...(versionDetails?.variables && { variables: versionDetails.variables }),
            // Update icon_meta to the selected version's icon_meta
            icon_meta: versionDetails?.icon_meta || selectedParticipant?.entity_settings?.icon_meta || {},
          },
        };
        setSelectedParticipant(updatedParticipant);
        setSelectedParticipants(prev =>
          prev.map(p =>
            p.entity_name !== updatedParticipant.entity_name ||
            p.entity_meta.id !== updatedParticipant.entity_meta.id
              ? p
              : { ...updatedParticipant },
          ),
        );

        // Update selectedParticipantDetails to reflect the new version details
        // This ensures icon_meta and other version-specific details are updated in UI
        setSelectedParticipantDetails(prev => ({
          ...(prev || {}),
          version_details: {
            ...(versionDetails || selectedParticipant?.version_details || {}),
          },
        }));
      },
      [fetchOriginalVersionDetails, selectedParticipant, selectedProjectId],
    );

    const onSendStarter = useCallback(
      starter => () => {
        chatInput.current.reset();
        chatInput.current.setValue(starter);
      },
      [],
    );

    useEffect(() => {
      if (selectedAgent && activeConversation?.isNew) {
        const keptSelectedAgent = {
          ...selectedAgent,
        };
        const keptSelectedAgentStarter = selectedAgentStarter;
        setTimeout(() => {
          convertParticipantAndAddIt({
            participant: { ...keptSelectedAgent, project_id: PUBLIC_PROJECT_ID },
            details: keptSelectedAgent,
          });
          if (keptSelectedAgentStarter) {
            onSendStarter(keptSelectedAgentStarter)();
          }
        }, 100);
        dispatch(actions.setSelectedAgentInfo({ agent: null, starter: null }));
      }
    }, [
      activeConversation?.isNew,
      convertParticipantAndAddIt,
      dispatch,
      onSendStarter,
      selectedAgent,
      selectedAgentStarter,
    ]);

    const onSend = async (question, inputContent) => {
      setIsSending(true);

      // Need to keep input content for sending message after conversation is created
      setNewConversationQuestion(inputContent);

      const newConversation = {
        id: activeConversationRef.current?.id || uuidv4(),
        name: activeConversationRef.current?.name || DefaultConversationName,
        is_private: true,
        participants: [],
        chat_history: [],
        isNew: true,
        isNamingPending: true, // Show "Naming…" spinner
        meta:
          internalTools.length > 0
            ? {
                internal_tools: internalTools,
              }
            : undefined,
        isSending: true,
        hasAttachments: attachments?.length > 0,
      };
      await onCreateConversation(
        newConversation,
        async (createdConversation, onComplete) => {
          if (createdConversation) {
            // Update model settings for the new conversation on remote
            const userSettings = NewConversationHelpers.getChatUserSettings(createdConversation, user.id);
            // Separate steps_limit from llm_settings — it belongs in conversation meta
            const { steps_limit, ...llmSettingsOnly } = llmSettings;
            const settingsToSave = {
              ...userSettings,
              ...llmSettingsOnly,
              model_name: selectedModel?.name,
              model_project_id: selectedModel?.project_id,
            };
            // Clean settings to remove reasoning_effort if model doesn't support it
            const cleanedSettings = cleanLLMSettings(settingsToSave, selectedModel);

            await updateChatLlmSettings({
              projectId: selectedProjectId,
              conversationId: createdConversation.id,
              llm_settings: cleanedSettings,
            });
            // Persist steps_limit to conversation meta
            if (steps_limit !== undefined) {
              conversationEditMeta({
                projectId: selectedProjectId,
                id: createdConversation.id,
                meta: { steps_limit },
              });
            }
            if (selectedParticipant) {
              setTimeout(async () => {
                const selectedParticipantFiltered = selectedParticipants.filter(
                  p => !p.meta.added_from_agent,
                );

                await addNewParticipants(selectedParticipantFiltered, createdConversation, participants => {
                  onComplete?.([
                    ...participants,
                    ...NewConversationHelpers.setUserLLmSettings(createdConversation.participants, user.id, {
                      model_name: selectedModel?.name,
                      model_project_id: selectedModel?.project_id,
                      ...llmSettingsOnly,
                    }),
                  ]);
                  const participant = participants.find(
                    p =>
                      (p.entity_name === selectedParticipant.entity_name ||
                        p.entity_settings.agent_type === selectedParticipant.entity_name) &&
                      p.entity_meta.id === selectedParticipant.entity_meta.id,
                  );
                  setActiveParticipant?.(participant);
                  setLocalActiveParticipant(createdConversation?.id, participant.id);

                  setTimeout(() => {
                    onPredictStreamRef.current?.(question, participant, createdConversation);
                  }, 30);
                });
                setIsSending(false);
              }, 0);
            } else {
              if (selectedParticipants.length) {
                setTimeout(async () => {
                  const selectedParticipantFiltered = selectedParticipants.filter(
                    p => !p.meta.added_from_agent,
                  );

                  await addNewParticipants(
                    selectedParticipantFiltered,
                    createdConversation,
                    async participants => {
                      onComplete?.([
                        ...participants,
                        ...NewConversationHelpers.setUserLLmSettings(
                          createdConversation.participants,
                          user.id,
                          {
                            model_name: selectedModel?.name,
                            model_project_id: selectedModel?.project_id,
                            ...llmSettingsOnly,
                          },
                        ),
                      ]);
                      setTimeout(() => {
                        onPredictStreamRef.current?.(question, null, createdConversation);
                      }, 30);
                    },
                  );
                  setIsSending(false);
                }, 0);
              } else {
                onComplete?.(
                  NewConversationHelpers.setUserLLmSettings(createdConversation.participants, user.id, {
                    model_name: selectedModel?.name,
                    model_project_id: selectedModel?.project_id,
                    ...llmSettingsOnly,
                  }),
                );
                setTimeout(() => {
                  onPredictStreamRef.current?.(question, null, createdConversation);
                }, 30);
              }
            }
          } else {
            setIsSending(false);
          }
        },
        true,
      );
    };

    useEffect(() => {
      return () => {
        stopProcessingSymbols();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectSavedOrDefaultModel = useCallback(() => {
      onClearSelectedParticipant();
      setSelectedModel(prevSelectedModel || defaultModel);
    }, [onClearSelectedParticipant, prevSelectedModel, defaultModel]);

    const onChangeVariables = useCallback(
      newVariables => {
        setSelectedParticipant(prev => ({
          ...prev,
          entity_settings: {
            ...(prev?.entity_settings || {}),
            variables: [...newVariables],
          },
        }));
        setSelectedParticipants(prev =>
          prev.map(p =>
            p.entity_name !== selectedParticipant.entity_name ||
            p.entity_meta.id === selectedParticipant.entity_meta.id
              ? p
              : {
                  ...selectedParticipant,
                  entity_settings: {
                    ...(selectedParticipant?.entity_settings || {}),
                    variables: [...newVariables],
                  },
                },
          ),
        );
      },
      [selectedParticipant],
    );

    if (hidden) return null;

    return (
      <ChatBodyContainer sx={styles.chatBodyContainer}>
        <Box sx={styles.mainContainer}>
          <Box sx={styles.welcomeSection}>
            <Box
              component="img"
              height={60}
              width={60}
              src={WelcomeImage}
              alt={systemSenderName}
              style={styles.welcomeImage}
            />
            <Typography
              component="div"
              variant="headingMedium"
              sx={styles.greetingText}
            >
              {`Hello, ${userName}!`}
            </Typography>
            <Typography
              component="div"
              variant="headingMedium"
              color="text.secondary"
            >
              What can I do for you today?
            </Typography>
          </Box>
          <Box sx={styles.inputContainer}>
            <NewChatInput
              placeholder="Type your message. Use # to search and add AI assistants to conversation."
              ref={chatInput}
              onSend={onSend}
              isLoading={isSending || isFetchingParticipant || isUploadingAttachments}
              isCreatingConversation={activeConversation?.isNew}
              disabledSend={
                !(!!selectedParticipant || !!selectedModel) ||
                isConversationNameInvalid ||
                totalValidationInfo?.length ||
                toolkitValidationInfoList?.length
              }
              onNormalKeyDown={onKeyDown}
              shouldHandleEnter
              tooltipOfSendButton={isConversationNameInvalid ? ConversationNameWarningMessage : ''}
              onShowParticipantsList={onShowParticipantsList}
              selectedVersionId={selectedParticipant?.entity_settings?.version_id}
              onSelectVersion={onSelectVersion}
              variables={selectedParticipant?.entity_settings?.variables || []}
              onChangeVariables={onChangeVariables}
              onShowAgentEditor={onShowAgentEditor}
              onShowPipelineEditor={onShowPipelineEditor}
              onCloseAgentEditor={onCloseAgentEditor}
              activeParticipant={selectedParticipant}
              activeParticipantDetails={selectedParticipantDetails}
              modelList={modelsData?.items || []}
              onSelectModel={onSelectModel}
              selectedModel={selectedModel}
              llmSettings={llmSettings}
              onSetLLMSettings={onSetLLMSettings}
              showStepsLimit
              selectSavedOrDefaultModel={selectSavedOrDefaultModel}
              selectedParticipant={selectedParticipant}
              onClearSelectedParticipant={onClearSelectedParticipant}
              //Attachment settings props
              onAttachFiles={onAttachFiles}
              attachments={attachments}
              onDeleteAttachment={onDeleteAttachment}
              isUploadingAttachments={isUploadingAttachments}
              uploadProgress={uploadProgress}
              disableAttachments={disableAttachments}
              onInternalToolsConfigChange={onInternalToolsConfigChange}
              internal_tools={internalTools}
            />
          </Box>
          <Box sx={styles.recommendationsContainer}>
            {showRecommendationList && (
              <RecommendationList
                onSelectParticipant={onSelectParticipant}
                existingParticipants={
                  activeConversation.participants || (selectedParticipant ? [selectedParticipant] : [])
                }
                onClose={onShowParticipantsList}
              />
            )}
            {query.slice(1) && (
              <SearchResultList
                query={query ? query.slice(1) : ''}
                onSelectParticipant={onSelectParticipant}
                stopProcessingSymbols={stopProcessingSymbols}
                existingParticipants={
                  activeConversation.participants || (selectedParticipant ? [selectedParticipant] : [])
                }
                onClose={event => {
                  if (event.target.innerHTML !== query) stopProcessingSymbols();
                }}
              />
            )}
            {conversationStarters?.length > 0 && !showRecommendationList && !query && (
              <Box sx={styles.conversationStartersContainer}>
                {conversationStarters
                  .filter(item => item.trim())
                  .map((item, index) => (
                    <EllipsisTextWithTooltip
                      key={index}
                      text={item}
                      onClick={onSendStarter(item)}
                      sx={styles.starterItem}
                      textSX={styles.starterTextSX}
                    />
                  ))}
              </Box>
            )}
          </Box>
        </Box>
      </ChatBodyContainer>
    );
  },
);

NewConversationView.displayName = 'NewConversationView';

/** @type {MuiSx} */
const newConversationViewStyles = () => ({
  chatBodyContainer: ({ breakpoints }) => ({
    [breakpoints.up('lg')]: {
      height: 'calc(100vh - 10rem)',
    },
    [breakpoints.down('lg')]: {
      minHeight: '40.625rem !important',
    },
  }),
  mainContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: '0.5rem',
    paddingX: '2.5rem',
    gap: '0.5rem',
  },
  welcomeSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    paddingBottom: '1rem',
    boxSizing: 'border-box',
    gap: '0.5rem',
    flex: 1,
  },
  welcomeImage: {
    marginBottom: '1rem',
  },
  greetingText: ({ palette }) => ({
    color: palette.primary.main,
  }),
  inputContainer: {
    display: 'flex',
    minHeight: '6.25rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  recommendationsContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    maxHeight: 'calc(50% - 3.625rem)',
    width: '100%',
  },
  conversationStartersContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    boxSizing: 'border-box',
    gap: '0.5rem',
    padding: '0.5rem 0',
  },
  starterItem: {
    width: '100%',
    height: '2.5rem',
    borderRadius: '0.75rem',
  },
  starterTextSX: {
    WebkitLineClamp: 1,
  },
});

export default NewConversationView;
