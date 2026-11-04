import { memo, useCallback, useMemo } from 'react';

import { Highlight, themes } from 'prism-react-renderer';

import { useTheme } from '@mui/material';

import { extraCodeFromBlock } from '@/[fsd]/features/chat/lib/helpers';
import { CodeBlockConstants } from '@/[fsd]/shared/lib/constants';
import { useCheckIsBlockEditing, useToast } from '@/[fsd]/shared/lib/hooks';
import { CANVAS_ADMIN_USER, CANVAS_SYSTEM_USER } from '@/common/constants';
import EditingPlaceholder from '@/components/Chat/EditingPlaceholder';
import useCopyDownloadHandlers from '@/hooks/chat/useCopyEventHandlers';

import CanvasContent from './CanvasContent';

const Canvas = memo(props => {
  const {
    content,
    onEdit,
    startPos,
    endPos,
    selectedCodeBlockInfo,
    interaction_uuid,
    conversation_uuid,
    canvasId,
    messageItemId,
    isStreaming,
    language = 'markdown',
    type = 'code',
    editors = [],
  } = props;

  const theme = useTheme();
  const { toastInfo } = useToast();

  const realEditors = useMemo(
    () =>
      editors?.filter(
        editor => editor.user_name !== CANVAS_ADMIN_USER && editor.user_name !== CANVAS_SYSTEM_USER,
      ) || [],
    [editors],
  );

  const editingTitle = useMemo(() => {
    if (type === 'diagram' || language === 'mermaid') return 'Diagram editing...';
    if (type === 'table') return 'Table editing...';
    return 'Code editing...';
  }, [language, type]);

  const editButtonTitle = useMemo(() => {
    if (type === 'diagram' || language === 'mermaid') return 'Edit diagram';
    if (type === 'table') return 'Edit table';
    return 'Edit code';
  }, [language, type]);

  const realContent = useMemo(() => {
    if (content.startsWith('```')) return content;
    if (type === 'code') return `\`\`\`${language}\n${content}\n\`\`\`\n`;
    if (type === 'diagram') return `\`\`\`mermaid\n${content}\n\`\`\`\n`;
    return content;
  }, [content, language, type]);

  const { isBlockEditing, blockId } = useCheckIsBlockEditing(canvasId, selectedCodeBlockInfo);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    toastInfo('The code has been copied to the clipboard.');
  }, [content, toastInfo]);

  const onDownload = useCallback(() => {
    const { LANG_TO_EXTENSION } = CodeBlockConstants;
    const ext = LANG_TO_EXTENSION[language?.toLowerCase()] ?? 'txt';
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `code.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, [content, language]);

  const { onClickCopy, onClickDownload } = useCopyDownloadHandlers({ onCopy, onDownload });

  const onClickEdit = useCallback(() => {
    onEdit?.({
      rawData: content,
      codeBlock: extraCodeFromBlock(content),
      language: type === 'table' ? 'markdownTable' : type === 'diagram' ? 'mermaid' : language,
      isBlock: true,
      startPos,
      endPos,
      canvasId,
      messageItemId,
      blockId,
      viewOnly: !!realEditors.length,
    });
  }, [onEdit, content, type, language, startPos, endPos, canvasId, messageItemId, blockId, realEditors]);

  if (isBlockEditing) {
    return <EditingPlaceholder title={editingTitle} />;
  }

  if (type === 'code' && language !== 'mermaid') {
    return (
      <Highlight
        theme={theme.palette.mode === 'dark' ? themes.vsDark : themes.oneLight}
        code={content}
        language={language}
      >
        {({ className, style = {} }) => (
          <pre
            className={className}
            style={{ ...style, overflow: 'hidden', paddingRight: '0.5rem', paddingBottom: '0.5rem' }}
          >
            <CanvasContent
              content={realContent}
              showEdit={!!onEdit}
              selectedCodeBlockInfo={selectedCodeBlockInfo}
              interaction_uuid={interaction_uuid}
              conversation_uuid={conversation_uuid}
              canvasId={canvasId}
              isStreaming={isStreaming}
              editButtonTitle={editButtonTitle}
              editors={realEditors}
              onClickEdit={onClickEdit}
              onClickCopy={onClickCopy}
              onClickDownload={onClickDownload}
            />
          </pre>
        )}
      </Highlight>
    );
  }

  return (
    <CanvasContent
      content={realContent}
      showEdit={!!onEdit}
      selectedCodeBlockInfo={selectedCodeBlockInfo}
      interaction_uuid={interaction_uuid}
      conversation_uuid={conversation_uuid}
      canvasId={canvasId}
      isStreaming={isStreaming}
      onClickEdit={onClickEdit}
      onClickCopy={onClickCopy}
      onClickDownload={onClickDownload}
      editButtonTitle={editButtonTitle}
      editors={realEditors}
      editStatusTitle={editingTitle}
    />
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
