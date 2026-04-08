import { useCallback, useState } from 'react';

const getEditorWarning = editorType => {
  switch (editorType) {
    case 'canvas':
      return 'You are editing canvas now. Do you want to close it and continue?';
    case 'agent':
      return 'You are editing agent now. Do you want to discard current changes and continue?';
    case 'toolkit':
      return 'You are editing toolkit now. Do you want to discard current changes and continue?';
    case 'mcp':
      return 'You are editing MCP now. Do you want to discard current changes and continue?';
    case 'artifact':
      return 'You are editing artifact now. Do you want to discard current changes and continue?';
    default:
      return 'You are editing now. Do you want to discard current changes and continue?';
  }
};

const streamingWarning =
  'Output is still generating.\nSwitching now will stop it and you may lose progress.\nSwitch anyway?';

export default function useCloseEditorAlert({
  editorType = 'editor', // 'canvas', 'agent', 'toolkit', 'mcp', 'artifact'
  isEditorOpen,
  onCloseEditor,
  onSelectParticipant,
  onSelectConversation,
  onSelectThisParticipant,
  isStreaming,
  setIsStreaming,
  boxRef,
}) {
  // stores the function that should execute after user confirms the warning
  const [operationInfo, setOperationInfo] = useState();
  const [openAlert, setOpenAlert] = useState(false);
  const [alertContent, setAlertContent] = useState(getEditorWarning(editorType));

  const onHandleSelectParticipant = useCallback(
    (participant, shouldMentionUser = true) => {
      // block operation and show warning if editor is open and dirty
      if (isEditorOpen) {
        setOperationInfo({ operation: () => onSelectParticipant(participant, shouldMentionUser) });
        setAlertContent(getEditorWarning(editorType));
        setOpenAlert(true);
      } else {
        // allow operation to proceed normally
        onSelectParticipant(participant, shouldMentionUser);
      }
    },
    [isEditorOpen, onSelectParticipant, editorType],
  );

  const onHandleSelectConversation = useCallback(
    conversation => {
      if (isEditorOpen) {
        setOperationInfo({ operation: () => onSelectConversation(conversation) });
        setAlertContent(getEditorWarning(editorType));
        setOpenAlert(true);
      } else if (isStreaming) {
        setOperationInfo({
          operation: () => {
            boxRef.current?.stopAll();
            setIsStreaming(false);
            onSelectConversation(conversation);
          },
        });
        setAlertContent(streamingWarning);
        setOpenAlert(true);
      } else {
        onSelectConversation(conversation);
      }
    },
    [isEditorOpen, isStreaming, onSelectConversation, setIsStreaming, boxRef, editorType],
  );

  const onHandleSelectThisParticipant = useCallback(
    selectedParticipant => {
      if (isEditorOpen) {
        setOperationInfo({ operation: () => onSelectThisParticipant(selectedParticipant) });
        setAlertContent(getEditorWarning(editorType));
        setOpenAlert(true);
      } else {
        onSelectThisParticipant(selectedParticipant);
      }
    },
    [isEditorOpen, onSelectThisParticipant, editorType],
  );

  const onCancelOperation = useCallback(() => {
    setOperationInfo();
    setOpenAlert(false);
  }, []);

  const onConfirmOperation = useCallback(() => {
    onCloseEditor?.();
    setOpenAlert(false);
    operationInfo?.operation();
    setOperationInfo();
  }, [onCloseEditor, operationInfo]);

  return {
    openAlert,
    alertContent,
    setOpenAlert,
    onHandleSelectParticipant,
    onHandleSelectConversation,
    onHandleSelectThisParticipant,
    onCancelOperation,
    onConfirmOperation,
  };
}
