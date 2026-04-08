import { useCallback, useState } from 'react';

import { WELCOME_MESSAGE_ID } from '@/common/constants';

const ALL_MESSAGES = 'ALL_MESSAGES';

export default function useDeleteMessageAlert({
  setChatHistory,
  chatInput,
  onDeleteChatMessage,
  onDeleteAllChatMessages,
  resetSessionRef,
  deleteAllRunNodes,
}) {
  const [openAlert, setOpenAlert] = useState(false);
  const [alertContent, setAlertContent] = useState('');
  const [messageIdToDelete, setMessageIdToDelete] = useState('');
  const onDeleteAnswer = useCallback(
    id => () => {
      setOpenAlert(true);
      setMessageIdToDelete(id);
      setAlertContent("The deleted message can't be restored. Are you sure to delete the message?");
    },
    [],
  );

  const onDeleteAll = useCallback(() => {
    setOpenAlert(true);
    setMessageIdToDelete(ALL_MESSAGES);
    setAlertContent("The deleted messages can't be restored. Are you sure to delete all the messages?");
  }, []);

  const onCloseAlert = useCallback(() => {
    setOpenAlert(false);
    setMessageIdToDelete('');
  }, []);

  const onClearChat = useCallback(() => {
    setChatHistory(prev => prev.filter(message => message.id === WELCOME_MESSAGE_ID));
    chatInput.current?.reset();
    if (resetSessionRef) {
      resetSessionRef.current = true;
    }
    deleteAllRunNodes && deleteAllRunNodes();
  }, [chatInput, deleteAllRunNodes, resetSessionRef, setChatHistory]);

  const onConfirmDelete = useCallback(() => {
    if (messageIdToDelete === ALL_MESSAGES) {
      if (!onDeleteAllChatMessages) {
        onClearChat();
      } else {
        onDeleteAllChatMessages(() => onClearChat());
      }
    } else {
      if (!onDeleteChatMessage) {
        setChatHistory(prevMessages => prevMessages.filter(message => message.id !== messageIdToDelete));
      } else {
        onDeleteChatMessage(messageIdToDelete, () =>
          setChatHistory(prevMessages => prevMessages.filter(message => message.id !== messageIdToDelete)),
        );
      }
    }
    onCloseAlert();
  }, [
    messageIdToDelete,
    onClearChat,
    onCloseAlert,
    onDeleteAllChatMessages,
    onDeleteChatMessage,
    setChatHistory,
  ]);

  return {
    openAlert,
    alertContent,
    messageIdToDelete,
    setOpenAlert,
    setAlertContent,
    setMessageIdToDelete,
    onDeleteAnswer,
    onDeleteAll,
    onConfirmDelete,
    onCloseAlert,
  };
}
