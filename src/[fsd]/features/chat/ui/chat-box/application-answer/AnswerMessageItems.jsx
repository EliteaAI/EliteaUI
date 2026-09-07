import { memo, useMemo } from 'react';

import { AskUserAnswerSummary } from '@/[fsd]/features/chat/ui';
import { formatJsonBlock } from '@/[fsd]/shared/lib/utils';
import Markdown from '@/[fsd]/shared/ui/markdown';
import { convertJsonToString, isNullOrUndefined } from '@/common/utils';
import Canvas from '@/components/Canvas';

const AnswerMessageItems = memo(props => {
  const {
    answer,
    message_items,
    nonAttachmentItems,
    interaction_uuid,
    conversation_uuid,
    onEdit,
    selectedCodeBlockInfo,
    isStreaming,
    isRegenerating,
    activeSpokenRange,
    messageItemOffsets,
    toolActions,
    realAnswer,
  } = props;

  // Formatting is O(size of the item) and this component re-renders on every
  // streamed chunk and on every spoken-word highlight, so doing it inline in the
  // JSX re-walks each payload hundreds of times per answer.
  const formattedItemContent = useMemo(() => {
    const formatted = {};
    nonAttachmentItems?.forEach(item => {
      if (item.item_type === 'text_message') {
        formatted[item.uuid] = formatJsonBlock(item.item_details.content) || '';
      }
    });
    return formatted;
  }, [nonAttachmentItems]);

  return (
    <>
      {toolActions?.length > 0 && <AskUserAnswerSummary toolActions={toolActions} />}

      {!isNullOrUndefined(answer) && !message_items?.length && (
        <Markdown
          interaction_uuid={interaction_uuid}
          conversation_uuid={conversation_uuid}
          onEdit={onEdit}
          selectedCodeBlockInfo={selectedCodeBlockInfo}
          isStreaming={isStreaming || isRegenerating}
          spokenRange={activeSpokenRange}
        >
          {realAnswer ?? ''}
        </Markdown>
      )}

      {!!nonAttachmentItems?.length &&
        nonAttachmentItems.map(item => {
          switch (item.item_type) {
            case 'canvas_message':
              return (
                <Canvas
                  key={item.uuid}
                  interaction_uuid={interaction_uuid}
                  conversation_uuid={conversation_uuid}
                  onEdit={onEdit}
                  selectedCodeBlockInfo={selectedCodeBlockInfo}
                  canvasId={item.uuid}
                  isStreaming={isStreaming || isRegenerating}
                  language={item.item_details.latest_version?.code_language || 'markdown'}
                  type={item.item_details.canvas_type}
                  editors={item.item_details.editors}
                  content={convertJsonToString(item.item_details.latest_version?.canvas_content ?? '') || ''}
                />
              );
            case 'text_message': {
              const itemOffset = messageItemOffsets[item.uuid] ?? 0;
              const itemEndPos = activeSpokenRange ? Math.max(0, activeSpokenRange.end - itemOffset) : 0;
              const itemSpokenRange =
                activeSpokenRange && itemEndPos > 0 ? { start: 0, end: itemEndPos } : null;
              return (
                <Markdown
                  key={item.uuid}
                  interaction_uuid={interaction_uuid}
                  conversation_uuid={conversation_uuid}
                  onEdit={onEdit}
                  selectedCodeBlockInfo={selectedCodeBlockInfo}
                  messageItemId={item.id}
                  isStreaming={isStreaming || isRegenerating}
                  spokenRange={itemSpokenRange}
                >
                  {formattedItemContent[item.uuid]}
                </Markdown>
              );
            }
            default:
              return null;
          }
        })}
    </>
  );
});

AnswerMessageItems.displayName = 'AnswerMessageItems';

export default AnswerMessageItems;
