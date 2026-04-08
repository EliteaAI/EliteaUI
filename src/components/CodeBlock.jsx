import { useCallback, useMemo, useState } from 'react';

import { Highlight, themes } from 'prism-react-renderer';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import useCopyDownloadHandlers from '@/hooks/chat/useCopyEventHandlers';
import useToast from '@/hooks/useToast';

import EditingPlaceholder from './Chat/EditingPlaceholder';
import EditIcon from './Icons/EditIcon';
import { useShouldDisableEditCanvas } from './MarkdownTableBlock';
import MermaidCodeBlock from './MermaidCodeBlock';

export const useCheckIsBlockEditing = (canvasId, selectedCodeBlockInfo) => {
  const [blockId] = useState(new Date().getTime());
  const isBlockEditing = useMemo(
    () =>
      (canvasId === selectedCodeBlockInfo?.canvasId && selectedCodeBlockInfo?.canvasId) ||
      (selectedCodeBlockInfo?.isCreatingCanvas && selectedCodeBlockInfo?.blockId === blockId),
    [
      canvasId,
      selectedCodeBlockInfo?.canvasId,
      selectedCodeBlockInfo?.isCreatingCanvas,
      selectedCodeBlockInfo?.blockId,
      blockId,
    ],
  );
  return { isBlockEditing, blockId };
};

const CodeBlock = ({
  markedToken,
  theme,
  onEdit,
  startPos,
  endPos,
  selectedCodeBlockInfo,
  canvasId,
  messageItemId,
  isStreaming,
  showToolbar,
}) => {
  const { toastInfo } = useToast();
  const shouldDisableEdit = useShouldDisableEditCanvas(isStreaming);
  const { isBlockEditing, blockId } = useCheckIsBlockEditing(canvasId, selectedCodeBlockInfo);
  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(markedToken.text);
    toastInfo('The code has been copied into clipboard');
  }, [markedToken.text, toastInfo]);
  const { onClickCopy } = useCopyDownloadHandlers({ onCopy });

  const onClickEdit = useCallback(() => {
    onEdit?.({
      rawData: markedToken.raw,
      codeBlock: markedToken.text,
      language: markedToken.lang,
      isBlock: true,
      startPos,
      endPos,
      canvasId,
      messageItemId,
      blockId,
    });
  }, [
    onEdit,
    markedToken.raw,
    markedToken.text,
    markedToken.lang,
    startPos,
    endPos,
    canvasId,
    messageItemId,
    blockId,
  ]);

  if (markedToken.lang === 'mermaid') {
    return (
      <MermaidCodeBlock
        markedToken={markedToken}
        theme={theme}
        onEdit={onEdit}
        startPos={startPos}
        endPos={endPos}
        selectedCodeBlockInfo={selectedCodeBlockInfo}
        canvasId={canvasId}
        messageItemId={messageItemId}
        isStreaming={isStreaming}
        showToolbar={showToolbar}
      />
    );
  }

  return !isBlockEditing ? (
    <>
      <Highlight
        theme={theme.palette.mode === 'dark' ? themes.vsDark : themes.oneLight}
        code={markedToken.text}
        language={markedToken.lang}
      >
        {({ className, style = {}, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={className}
            style={{ ...style, overflow: 'hidden', paddingRight: '8px', paddingBottom: '8px' }}
          >
            <Box
              sx={{
                width: '100%',
                display: showToolbar ? 'flex' : 'none',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: '8px 0px 8px 8px',
                gap: '8px',
              }}
            >
              {onEdit && (
                <Tooltip
                  title="Edit code"
                  placement="top"
                >
                  <Box component="span">
                    <IconButton
                      variant="elitea"
                      color="tertiary"
                      disabled={shouldDisableEdit}
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
                        fill={
                          !shouldDisableEdit
                            ? theme.palette.icon.fill.default
                            : theme.palette.icon.fill.disabled
                        }
                      />
                    </IconButton>
                  </Box>
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
            <Box sx={{ width: '100%', overflowX: 'scroll' }}>
              {tokens.map((line, i) => (
                <div
                  key={i}
                  {...getLineProps({ line })}
                >
                  <span> </span>
                  {line.map((token, key) => (
                    <span
                      key={key}
                      {...getTokenProps({ token })}
                    />
                  ))}
                </div>
              ))}
            </Box>
          </pre>
        )}
      </Highlight>
    </>
  ) : (
    <EditingPlaceholder title="Code editing..." />
  );
};

export default CodeBlock;
