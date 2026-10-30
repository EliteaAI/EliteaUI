import { Suspense, lazy, memo, useCallback } from 'react';

import { Highlight, themes } from 'prism-react-renderer';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { CodeBlockConstants } from '@/[fsd]/shared/lib/constants';
import { useCheckIsBlockEditing, useToast } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import EditingPlaceholder from '@/components/Chat/EditingPlaceholder';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import EditIcon from '@/components/Icons/EditIcon';
import { useShouldDisableEditCanvas } from '@/components/MarkdownTableBlock';
import useCopyDownloadHandlers from '@/hooks/chat/useCopyEventHandlers';

const MermaidCodeBlock = lazy(() => import('@/components/MermaidCodeBlock'));

const CodeBlock = memo(props => {
  const {
    markedToken,
    onEdit,
    startPos,
    endPos,
    selectedCodeBlockInfo,
    canvasId,
    messageItemId,
    isStreaming,
    showToolbar,
  } = props;

  const theme = useTheme();
  const { toastInfo } = useToast();
  const shouldDisableEdit = useShouldDisableEditCanvas(isStreaming);
  const { isBlockEditing, blockId } = useCheckIsBlockEditing(canvasId, selectedCodeBlockInfo);
  const styles = codeBlockStyles(theme);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(markedToken.text);
    toastInfo('The code has been copied to the clipboard.');
  }, [markedToken.text, toastInfo]);

  const onDownload = useCallback(() => {
    const { LANG_TO_EXTENSION } = CodeBlockConstants;
    const ext = LANG_TO_EXTENSION[markedToken.lang?.toLowerCase()] ?? 'txt';
    const blob = new Blob([markedToken.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [markedToken.lang, markedToken.text]);

  const { onClickCopy, onClickDownload } = useCopyDownloadHandlers({ onCopy, onDownload });

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
      <Suspense fallback={<Box sx={styles.mermaidFallback} />}>
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
      </Suspense>
    );
  }

  return !isBlockEditing ? (
    <Highlight
      theme={theme.palette.mode === 'dark' ? themes.vsDark : themes.oneLight}
      code={markedToken.text}
      language={markedToken.lang}
    >
      {({ className, style = {}, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={className}
          style={styles.pre(style)}
        >
          <Box sx={[styles.toolbar, !showToolbar && styles.toolbarHidden]}>
            <Tooltip
              title="Download code"
              placement="top"
            >
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.icon}
                onClick={onClickDownload}
              >
                <DownloadIcon sx={styles.icon} />
              </Button.BaseBtn>
            </Tooltip>
            {onEdit && (
              <Tooltip
                title="Edit code"
                placement="top"
              >
                <Box component="span">
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.icon}
                    disabled={shouldDisableEdit}
                    onClick={onClickEdit}
                  >
                    <EditIcon
                      sx={styles.icon}
                      fill={!shouldDisableEdit ? theme.palette.icon.default : theme.palette.icon.disabled}
                    />
                  </Button.BaseBtn>
                </Box>
              </Tooltip>
            )}
            <Tooltip
              title="Copy code"
              placement="top"
            >
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.icon}
                onClick={onClickCopy}
              >
                <ContentCopyIcon sx={styles.copyIcon} />
              </Button.BaseBtn>
            </Tooltip>
          </Box>
          <Box sx={styles.codeScroll}>
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
  ) : (
    <EditingPlaceholder title="Code editing..." />
  );
});

CodeBlock.displayName = 'CodeBlock';

/** @type {MuiSx} */
const codeBlockStyles = theme => ({
  mermaidFallback: { padding: '0.5rem' },
  pre: baseStyle => ({ ...baseStyle, overflow: 'hidden', paddingRight: '0.5rem', paddingBottom: '0.5rem' }),
  toolbar: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '0.5rem 0 0.5rem 0.5rem',
    gap: '0.5rem',
  },
  toolbarHidden: {
    display: 'none',
  },
  codeScroll: {
    width: '100%',
    overflowX: 'scroll',
  },
  icon: { fontSize: '1rem' },
  copyIcon: {
    fontSize: '1rem',
    color: theme.palette.icon.default,
  },
});

export default CodeBlock;
