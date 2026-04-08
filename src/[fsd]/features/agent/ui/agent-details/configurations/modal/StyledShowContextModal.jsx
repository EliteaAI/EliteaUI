import { memo, useEffect, useMemo, useRef } from 'react';

import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { ParseYamlToMermaidHelpers } from '@/[fsd]/features/agent/lib/helpers';
import ModalMessage from '@/[fsd]/features/agent/ui/agent-details/configurations/modal/ModalMessage';
import { ROLES } from '@/common/constants';
import CloseIcon from '@/components/Icons/CloseIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import Markdown from '@/components/Markdown';
import MermaidDiagramOutput from '@/components/MermaidDiagramOutput/DiagramOutput';
import useToast from '@/hooks/useToast';

const StyledShowContextModal = memo(props => {
  const {
    open,
    onClose,
    context = '',
    messages = [],
    contextLabel = 'Context',
    renderContextAsMermaid = false,
    renderInMarkdown = true,
    isLoading = false,
  } = props;
  const inputRef = useRef();
  const styles = modalStyles();
  const mermaid = useMemo(
    () => (renderContextAsMermaid ? ParseYamlToMermaidHelpers.parseYamlToMermaid(context) : ''),
    [context, renderContextAsMermaid],
  );
  const { toastError, toastInfo } = useToast();

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(context);
      toastInfo('The content has been copied to the clipboard');
    } catch {
      toastError('Failed to copy the content!');
      return;
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onKeyDown={handleKeyDown}
      onClick={() => inputRef.current?.focus()}
      slotProps={{
        paper: {
          sx: styles.dialogPaper,
        },
      }}
    >
      <DialogTitle
        variant="headingMedium"
        color="text.secondary"
        sx={styles.dialogTitle}
      >
        <Box sx={styles.titleContainer}>
          {contextLabel}
          <Box sx={styles.buttonsContainer}>
            {!renderContextAsMermaid && context && (
              <StyledTooltip
                title="Copy to clipboard"
                placement="top"
              >
                <IconButton
                  sx={styles.copyButton}
                  variant="elitea"
                  color="tertiary"
                  onClick={onCopy}
                >
                  <CopyIcon sx={styles.copyIcon} />
                </IconButton>
              </StyledTooltip>
            )}
            <IconButton
              sx={styles.closeButton}
              variant="elitea"
              color="tertiary"
              onClick={onClose}
            >
              <CloseIcon sx={styles.closeIcon} />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={styles.dialogContent}>
        {isLoading && <CircularProgress size={20} />}
        {renderContextAsMermaid && <MermaidDiagramOutput code={mermaid} />}
        {!renderContextAsMermaid && context && (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={renderInMarkdown ? undefined : styles.preserveWhitespace}
          >
            {renderInMarkdown ? <Markdown>{context}</Markdown> : context}
          </Typography>
        )}
        {messages.map(({ id, role, content }) => (
          <ModalMessage
            key={id}
            title={role}
            message={content}
            isUserMessage={role === ROLES.User}
          />
        ))}
      </DialogContent>
    </Dialog>
  );
});

StyledShowContextModal.displayName = 'StyledShowContextModal';

/** @type {MuiSx} */
const modalStyles = () => ({
  dialogPaper: ({ palette }) => ({
    background: palette.background.tabPanel,
    borderRadius: '1rem',
    border: `1px solid ${palette.border.lines}`,
    boxShadow: palette.boxShadow.default,
    marginTop: 0,
    maxWidth: '90vw',
    height: 'calc(100vh - 10rem)',
    marginLeft: '0rem',
    marginRight: '0rem',
    marginBottom: '0rem',
  }),

  dialogTitle: {
    height: '3.75rem',
    padding: '1rem 2rem',
  },

  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonsContainer: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  closeButton: {
    marginLeft: '0rem',
  },

  closeIcon: ({ palette }) => ({
    fontSize: '1rem',
    cursor: 'pointer',
    fill: palette.icon.fill.default,
  }),

  dialogContent: ({ palette }) => ({
    padding: '1rem 2rem !important',
    width: '80vw',
    maxWidth: '90vw',
    height: 'calc(100vh - 13.75rem)',
    borderTop: `1px solid ${palette.border.lines}`,
    background: palette.background.showContextDialog,
    overflowY: 'scroll',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  }),
  copyIcon: {
    fontSize: '1rem',
  },
  preserveWhitespace: {
    whiteSpaceCollapse: 'preserve',
  },
});

export default StyledShowContextModal;
