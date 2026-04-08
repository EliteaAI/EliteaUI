import { useCallback, useMemo } from 'react';

import { Highlight, themes } from 'prism-react-renderer';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, IconButton, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { CANVAS_ADMIN_USER, CANVAS_SYSTEM_USER, PERMISSIONS } from '@/common/constants';
import useCopyDownloadHandlers from '@/hooks/chat/useCopyEventHandlers';
import useCheckPermission from '@/hooks/useCheckPermission';
import useToast from '@/hooks/useToast';

import AuthorContainer from './AuthorContainer';
import EditingPlaceholder from './Chat/EditingPlaceholder';
import { useCheckIsBlockEditing } from './CodeBlock';
import EditIcon from './Icons/EditIcon';
import Markdown from './Markdown';

function trimEmptyStringsAtEnd(array = []) {
  let endIndex = array.length - 1;

  // Iterate from the end of the array and find the first non-empty string
  while (endIndex >= 0 && array[endIndex] === '') {
    endIndex--;
  }

  // Return a new array up to the last non-empty string
  return array.slice(0, endIndex + 1);
}

export const extraCodeFromBlock = (code = '') => {
  if (code.startsWith('```')) {
    const splitLines = trimEmptyStringsAtEnd(code.split('\n'));
    return splitLines.slice(1, splitLines.length - 1).join('\n');
  }
  return code;
};

const CanvasContent = ({
  content,
  showEdit,
  selectedCodeBlockInfo,
  interaction_uuid,
  conversation_uuid,
  canvasId,
  isStreaming,
  onClickEdit,
  onClickCopy,
  editButtonTitle = 'Edit Code',
  editors = [],
  editStatusTitle = 'is editing...',
}) => {
  const theme = useTheme();
  const { checkPermission } = useCheckPermission();
  return (
    <>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '8px 0px 8px 8px',
          gap: '8px',
        }}
      >
        {editors.length > 0 && (
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent={'flex-start'}
            gap={'8px'}
          >
            <AuthorContainer
              authors={editors.map(item => ({ name: item.user_name, avatar: item.user_avatar }))}
              disabledNavigation
            />
            <Typography
              variant="bodySmall"
              color="text.primary"
            >
              {editStatusTitle}
            </Typography>
          </Box>
        )}
        {showEdit && (
          <Tooltip
            title={editors.length > 0 ? 'Watch editing' : editButtonTitle}
            placement="top"
          >
            <span>
              <IconButton
                variant="elitea"
                color="tertiary"
                disabled={isStreaming || !checkPermission(PERMISSIONS.chat.canvas.update)}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onClick={onClickEdit}
              >
                <EditIcon
                  sx={{ fontSize: 16 }}
                  fill={!isStreaming ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled}
                />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Tooltip
          title="Copy code"
          placement="top"
        >
          <IconButton
            variant="elitea"
            color="tertiary"
            sx={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: '0px',
            }}
            onClick={onClickCopy}
          >
            <ContentCopyIcon sx={{ fontSize: '16px', color: theme.palette.icon.fill.default }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Markdown
        interaction_uuid={interaction_uuid}
        conversation_uuid={conversation_uuid}
        selectedCodeBlockInfo={selectedCodeBlockInfo}
        canvasId={canvasId}
        isStreaming={isStreaming}
        showToolbar={false}
      >
        {content || ' '}
      </Markdown>
    </>
  );
};

const Canvas = ({
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
}) => {
  const theme = useTheme();
  const { toastInfo } = useToast();
  const realEditors = useMemo(
    () =>
      editors?.filter(
        editor => editor.user_name !== CANVAS_ADMIN_USER && editor.user_name !== CANVAS_SYSTEM_USER,
      ) || [],
    [editors],
  );
  const editingTitle = useMemo(
    () =>
      type === 'code' && language !== 'mermaid'
        ? 'Code editing...'
        : type === 'diagram' || language === 'mermaid'
          ? 'Diagram editing...'
          : 'Table editing...',
    [language, type],
  );
  const editButtonTitle = useMemo(
    () =>
      type === 'code' && language !== 'mermaid'
        ? 'Edit code'
        : type === 'diagram' || language === 'mermaid'
          ? 'Edit diagram'
          : 'Edit table',
    [language, type],
  );
  const realContent = useMemo(() => {
    if (!content.startsWith('```')) {
      switch (type) {
        case 'code':
          return `\`\`\`${language}\n${content}\n\`\`\`\n`;
        case 'diagram':
          return `\`\`\`mermaid\n${content}\n\`\`\`\n`;
        default:
          return content;
      }
    }
    return content;
  }, [content, language, type]);
  const { isBlockEditing, blockId } = useCheckIsBlockEditing(canvasId, selectedCodeBlockInfo);
  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    toastInfo('The code has been copied into clipboard');
  }, [content, toastInfo]);
  const { onClickCopy } = useCopyDownloadHandlers({ onCopy });

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

  return !isBlockEditing ? (
    type === 'code' && language !== 'mermaid' ? (
      <Highlight
        theme={theme.palette.mode === 'dark' ? themes.vsDark : themes.oneLight}
        code={content}
        language={language}
      >
        {({ className, style = {} }) => (
          <pre
            className={className}
            style={{ ...style, overflow: 'hidden', paddingRight: '8px', paddingBottom: '8px' }}
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
            />
          </pre>
        )}
      </Highlight>
    ) : (
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
        editButtonTitle={editButtonTitle}
        editors={realEditors}
        editingTitle={editingTitle}
      />
    )
  ) : (
    <EditingPlaceholder title={editingTitle} />
  );
};

export default Canvas;
