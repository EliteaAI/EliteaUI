import { useCallback, useEffect, useRef, useState } from 'react';

import { useCreateCanvasMutation } from '@/api/chat';
import { isNullOrUndefined } from '@/common/utils';
import { useCanvasEditSocket } from '@/hooks/chat/useCanvasSocket';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export default function useEditCanvas({
  setCollapsedParticipants,
  setCollapsedConversations,
  setChatHistory,
}) {
  const [selectedCodeBlockInfo, setSelectedCodeBlockInfo] = useState();
  const canvasEditorRef = useRef();
  const pendingInitialCanvasContentRef = useRef(null);
  const projectId = useSelectedProjectId();
  const [createCanvas, { isError, isSuccess, data, error }] = useCreateCanvasMutation();
  const { sendChangeToRemote } = useCanvasEditSocket();

  const [sizes, setSizes] = useState([100, 0]);

  const onDragEnd = useCallback(newSizes => setSizes(newSizes), []);

  const gutterStyle = useCallback(
    () => ({
      cursor: selectedCodeBlockInfo?.selectedMessage ? 'col-resize' : 'not-allowed', // Show whether dragging is enabled
      pointerEvents: selectedCodeBlockInfo?.selectedMessage ? 'auto' : 'none', // Disable gutter interaction when dragging is off
      width: selectedCodeBlockInfo?.selectedMessage ? '24px' : '0px', // Hide the gutter entirely when dragging is off
    }),
    [selectedCodeBlockInfo?.selectedMessage],
  );

  const onShowCanvasEditor = useCallback(
    ({
      message,
      rawData,
      codeBlock,
      language,
      isBlock,
      startPos,
      endPos,
      canvasId,
      messageItemId,
      blockId,
      viewOnly,
    }) => {
      if (!isNullOrUndefined(codeBlock)) {
        if (canvasId) {
          pendingInitialCanvasContentRef.current = null;
          setSelectedCodeBlockInfo({
            selectedMessage: message,
            codeBlock,
            language,
            isBlock,
            rawData,
            startPos,
            endPos,
            blockId,
            canvasId,
            messageItemId,
            viewOnly,
          });
        } else {
          pendingInitialCanvasContentRef.current = codeBlock;
          setSelectedCodeBlockInfo({
            selectedMessage: message,
            codeBlock,
            language,
            isBlock,
            rawData,
            startPos,
            endPos,
            blockId,
            isCreatingCanvas: true,
            viewOnly,
          });
          const name = !isBlock
            ? 'Edit response'
            : language === 'markdownTable'
              ? 'Edit table'
              : language === 'mermaid'
                ? 'Edit diagram'
                : 'Edit code';
          createCanvas({
            projectId,
            message_group_id: message.originalId,
            message_item_id: messageItemId,
            name,
            // code | text | diagram | table | other
            canvas_type: language === 'mermaid' ? 'diagram' : language === 'markdownTable' ? 'table' : 'code',
            meta: {},
            canvas_content_starts_at: startPos,
            canvas_content_ends_at: endPos,
            // optional field
            code_language: language === 'markdownTable' ? 'markdown' : language,
          });
        }
      }
      setSizes([50, 50]);
      setCollapsedParticipants(true);
      setCollapsedConversations(true);
    },
    [createCanvas, projectId, setCollapsedConversations, setCollapsedParticipants],
  );

  useEffect(() => {
    if (isSuccess) {
      const initialContent = pendingInitialCanvasContentRef.current;
      if (data?.uuid && typeof initialContent === 'string' && initialContent.length > 0) {
        sendChangeToRemote(data.uuid, initialContent);
      }
      pendingInitialCanvasContentRef.current = null;

      setSelectedCodeBlockInfo(prev => ({
        ...prev,
        isCreatingCanvas: undefined,
        canvasId: data.uuid,
        messageItemId: data.id,
      }));
    }
  }, [data?.id, data?.uuid, isSuccess, sendChangeToRemote]);

  useEffect(() => {
    if (isError) {
      pendingInitialCanvasContentRef.current = null;
      setSelectedCodeBlockInfo(prev => ({ ...prev, isCreatingCanvas: undefined, createCanvasError: error }));
    }
  }, [error, isError]);

  const onCloseCanvasEditor = useCallback(
    (hasChange = true, finalResult, language) => {
      if (hasChange || selectedCodeBlockInfo?.language !== language) {
        let newContent = '';
        if (!selectedCodeBlockInfo?.isBlock) {
          if (typeof newContent !== 'string') {
            try {
              newContent = JSON.stringify(finalResult, null, 2);
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('invalid json error:', err);
              newContent = finalResult;
            }
          } else {
            newContent = finalResult;
          }
        } else {
          newContent = finalResult;
        }
        setChatHistory(prevMessages =>
          prevMessages.map(message =>
            message.id !== selectedCodeBlockInfo?.selectedMessage?.id
              ? message
              : {
                  ...message,
                  message_items: message.message_items.map(item =>
                    item.uuid !== selectedCodeBlockInfo?.canvasId
                      ? item
                      : {
                          ...item,
                          item_details: {
                            ...item.item_details,
                            latest_version: {
                              ...item.item_details.latest_version,
                              canvas_content: newContent,
                              code_language: language,
                            },
                          },
                        },
                  ),
                },
          ),
        );
      }
      setSelectedCodeBlockInfo();
      setSizes([100, 0]);
      setCollapsedParticipants(false);
      setCollapsedConversations(false);
    },
    [
      selectedCodeBlockInfo?.canvasId,
      selectedCodeBlockInfo?.isBlock,
      selectedCodeBlockInfo?.language,
      selectedCodeBlockInfo?.selectedMessage?.id,
      setChatHistory,
      setCollapsedConversations,
      setCollapsedParticipants,
    ],
  );

  return {
    sizes,
    onDragEnd,
    gutterStyle,
    selectedCodeBlockInfo,
    setSelectedCodeBlockInfo,
    onCloseCanvasEditor,
    onShowCanvasEditor,
    canvasEditorRef,
  };
}
