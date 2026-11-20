import { useCallback, useEffect, useRef, useState } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useCheckIsBlockEditing, useMermaidQuickFix, useToast } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useCanvasEditSocket } from '@/hooks/chat/useCanvasSocket';
import useCopyDownloadHandlers from '@/hooks/chat/useCopyEventHandlers';

import EditingPlaceholder from './Chat/EditingPlaceholder';
import EditIcon from './Icons/EditIcon';
import { useShouldDisableEditCanvas } from './MarkdownTableBlock';
import MermaidDiagramOutput from './MermaidDiagramOutput/DiagramOutput';

const MermaidCodeBlock = ({
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
  const { isBlockEditing, blockId } = useCheckIsBlockEditing(canvasId, selectedCodeBlockInfo);
  const shouldDisableEdit = useShouldDisableEditCanvas(isStreaming);

  const { sendChangeToRemote } = useCanvasEditSocket();
  const diagramContainerRef = useRef(null);
  const pendingScrollRestoreRef = useRef(null);
  const [fixedCode, setFixedCode] = useState('');

  const displayedCode = fixedCode || markedToken.text;
  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(displayedCode);
    toastInfo('The code has been copied to the clipboard.');
  }, [displayedCode, toastInfo]);
  const { onClickCopy } = useCopyDownloadHandlers({ onCopy });

  const onClickEdit = useCallback(() => {
    onEdit?.({
      rawData: markedToken.raw,
      codeBlock: displayedCode,
      language: 'mermaid',
      isBlock: true,
      startPos,
      endPos,
      canvasId,
      messageItemId,
      blockId,
    });
  }, [onEdit, markedToken.raw, displayedCode, startPos, endPos, canvasId, messageItemId, blockId]);

  const getScrollableAncestor = useCallback(element => {
    if (!element) return document.scrollingElement || document.documentElement;

    let parent = element.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      const isScrollable =
        (overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight;
      if (isScrollable) {
        return parent;
      }
      parent = parent.parentElement;
    }

    return document.scrollingElement || document.documentElement;
  }, []);

  const captureScrollPosition = useCallback(() => {
    const container = diagramContainerRef.current;
    const scrollable = getScrollableAncestor(container);
    const beforeTop = container?.getBoundingClientRect?.().top;
    if (container && typeof beforeTop === 'number') {
      pendingScrollRestoreRef.current = { scrollable, beforeTop };
    }
  }, [getScrollableAncestor]);

  const onQuickFixed = useCallback(
    newCode => {
      setFixedCode(newCode);

      if (canvasId) {
        sendChangeToRemote(canvasId, newCode);
      }
    },
    [canvasId, sendChangeToRemote],
  );

  const { handleQuickFix, isQuickFixLoading, quickFixTooltip } = useMermaidQuickFix({
    onBeforeRequest: captureScrollPosition,
    onFixed: onQuickFixed,
  });

  useEffect(() => {
    if (!pendingScrollRestoreRef.current) return;

    const container = diagramContainerRef.current;
    if (!container) {
      pendingScrollRestoreRef.current = null;
      return;
    }

    const { scrollable, beforeTop } = pendingScrollRestoreRef.current;
    pendingScrollRestoreRef.current = null;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const afterTop = container.getBoundingClientRect().top;
        const delta = afterTop - beforeTop;
        if (!delta) return;

        const scrollingElement = document.scrollingElement || document.documentElement;
        if (
          scrollable === scrollingElement ||
          scrollable === document.body ||
          scrollable === document.documentElement
        ) {
          window.scrollBy(0, delta);
        } else {
          scrollable.scrollTop += delta;
        }
      });
    });
  }, [fixedCode]);

  return !isBlockEditing ? (
    <>
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
            title="Edit diagram"
            placement="top"
          >
            <span>
              <Button.BaseBtn
                data-testid="chat-diagram-edit-button"
                variant={BUTTON_VARIANTS.tertiary}
                disabled={shouldDisableEdit}
                startIcon={<EditIcon sx={{ fontSize: '1rem' }} />}
                onClick={onClickEdit}
              />
            </span>
          </Tooltip>
        )}
        <Tooltip
          title="Copy code"
          placement="top"
        >
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={<ContentCopyIcon sx={{ fontSize: '1rem' }} />}
            onClick={onClickCopy}
          />
        </Tooltip>
      </Box>
      <Box
        ref={diagramContainerRef}
        sx={{ width: '100%', overflowX: 'scroll', height: '500px' }}
      >
        <MermaidDiagramOutput
          code={displayedCode}
          key={theme.palette.mode}
          onQuickFix={handleQuickFix}
          isQuickFixLoading={isQuickFixLoading}
          quickFixTooltip={quickFixTooltip}
        />
      </Box>
    </>
  ) : (
    <EditingPlaceholder title="Diagram editing..." />
  );
};

export default MermaidCodeBlock;
