import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import FullscreenOutlinedIcon from '@/assets/full-screen-icon.svg?react';
import StyledInputModal from '@/components/StyledInputModal';
import useToast from '@/hooks/useToast';

import { useWriteEvalHumanScoreMutation } from '../../api';
import {
  buildCaseContentColumns,
  clampHumanScore,
  isValidHumanScore,
  parseEvalError,
  resolveHumanScale,
} from '../../lib/helpers';
import CaseContentColumn from './CaseContentColumn';
import CaseContentPreviewModal from './CaseContentPreviewModal';
import HumanScoreControl from './HumanScoreControl';

const COMMENT_MAX_LENGTH = 2000;
// Shared by the inline field and the expanded editor, so the cap cannot be walked around by
// composing the comment full screen.
const COMMENT_INPUT_PROPS = { maxLength: COMMENT_MAX_LENGTH };
// Keeps the label raised so the empty-state placeholder stays visible under it.
const SHRUNK_LABEL = { shrink: true };
const COMMENT_FIELD_LABEL = 'Comment (optional)';
const THREE_COLUMN_FLEX = { input: 20, actualOutput: 40, expectedOutput: 40 };

const HumanEvaluationModal = memo(props => {
  const { open, projectId, runId, cell, caseData, onClose } = props;

  const { toastError, toastSuccess } = useToast();
  const [writeHumanScore, { isLoading: isSaving }] = useWriteEvalHumanScoreMutation();

  const [score, setScore] = useState(null);
  const [comment, setComment] = useState('');
  const [fullScreenColumn, setFullScreenColumn] = useState(null);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);

  const binding = cell?.binding ?? null;
  const caseItem = caseData?.case ?? null;
  const scale = useMemo(() => resolveHumanScale(binding), [binding]);

  // Reset on open so a cancelled edit never leaks into the next dimension opened.
  useEffect(() => {
    if (!open) return;
    setScore(cell?.nativeScore ?? null);
    setComment(cell?.humanNote ?? '');
    setFullScreenColumn(null);
    setIsCommentExpanded(false);
  }, [open, cell]);

  const columns = useMemo(
    () => buildCaseContentColumns(caseItem, { evidenceScope: binding?.evidenceScope }),
    [caseItem, binding],
  );

  const handleOpenFullScreen = useCallback(column => {
    setFullScreenColumn(column);
  }, []);

  const handleCloseFullScreen = useCallback(() => {
    setFullScreenColumn(null);
  }, []);

  const handleCommentChange = useCallback(event => {
    setComment(event.target.value);
  }, []);

  const handleOpenCommentExpanded = useCallback(() => {
    setIsCommentExpanded(true);
  }, []);

  const handleCloseCommentExpanded = useCallback(() => {
    setIsCommentExpanded(false);
  }, []);

  // StyledInputModal reports the edited text as a synthetic change event on blur/close.
  const handleExpandedCommentChange = useCallback(event => {
    setComment(event.target.value);
  }, []);

  const isValid = isValidHumanScore(score, scale);

  const handleSave = useCallback(async () => {
    if (!isValid || cell?.binding?.dimension_id == null || caseData?.id == null || runId == null) return;
    const trimmedComment = comment.trim();
    try {
      await writeHumanScore({
        projectId,
        runId,
        body: {
          dataset_case_id: caseData.id,
          dimension_id: cell.binding.dimension_id,
          native_score: clampHumanScore(score, scale),
          note: trimmedComment || null,
        },
      }).unwrap();
      toastSuccess('Evaluation saved.');
      onClose?.();
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to save the evaluation.'));
    }
  }, [
    isValid,
    cell,
    caseData,
    runId,
    projectId,
    score,
    scale,
    comment,
    writeHumanScore,
    toastSuccess,
    toastError,
    onClose,
  ]);

  const styles = humanEvaluationModalStyles(columns.length);

  return (
    <>
      <Modal.BaseModal
        open={open}
        onClose={onClose}
        variant={ModalConstants.MODAL_VARIANT.complex}
        title={binding?.name ?? 'Human evaluation'}
        data-testid="human-evaluation-modal"
        closeButtonTestId="human-evaluation-close"
        sx={styles.dialogPaper}
        dialogSx={styles.dialogContent}
        content={
          <Box sx={styles.body}>
            {binding?.guidance && (
              <Box sx={styles.guidance}>
                <Typography
                  variant="labelMedium"
                  sx={styles.guidanceTitle}
                >
                  Review and score the response
                </Typography>
                <Typography
                  variant="bodySmall"
                  sx={styles.guidanceText}
                >
                  {binding.guidance}
                </Typography>
              </Box>
            )}

            <Box sx={styles.columnsContainer}>
              {columns.map(column => (
                <CaseContentColumn
                  key={column.key}
                  column={column}
                  onFullScreen={handleOpenFullScreen}
                  sx={styles.column(column.key)}
                />
              ))}
            </Box>

            <Box sx={styles.scoreRow}>
              <HumanScoreControl
                scale={scale}
                value={score}
                onChange={setScore}
                disabled={isSaving}
              />
              <Box sx={styles.commentField}>
                <Input.InputBase
                  variant="standard"
                  label={COMMENT_FIELD_LABEL}
                  placeholder="—"
                  InputLabelProps={SHRUNK_LABEL}
                  multiline
                  maxRows={3}
                  value={comment}
                  onChange={handleCommentChange}
                  disabled={isSaving}
                  showCopyAction={false}
                  showFullScreenAction={false}
                  showExpandAction={false}
                  inputProps={COMMENT_INPUT_PROPS}
                  data-testid="human-evaluation-comment"
                />
                <Box
                  className="comment-expand-action"
                  sx={styles.commentExpandButton}
                >
                  <Tooltip
                    title="Full screen view"
                    placement="top"
                  >
                    <Button.BaseBtn
                      variant={BUTTON_VARIANTS.tertiary}
                      aria-label="Expand comment"
                      onClick={handleOpenCommentExpanded}
                      sx={styles.iconButton}
                      data-testid="human-evaluation-comment-expand"
                    >
                      <FullscreenOutlinedIcon style={styles.expandIcon} />
                    </Button.BaseBtn>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Box>
        }
        actions={
          <>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.secondary}
              onClick={onClose}
              data-testid="human-evaluation-cancel"
            >
              Cancel
            </Button.BaseBtn>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.primary}
              disabled={!isValid || isSaving}
              onClick={handleSave}
              data-testid="human-evaluation-save"
            >
              Save
            </Button.BaseBtn>
          </>
        }
      />

      <CaseContentPreviewModal
        open={fullScreenColumn != null}
        label={fullScreenColumn?.label}
        content={fullScreenColumn?.content}
        onClose={handleCloseFullScreen}
      />

      {isCommentExpanded && (
        <StyledInputModal
          open={isCommentExpanded}
          title={COMMENT_FIELD_LABEL}
          value={comment}
          hasOnChangeCallback
          inputProps={COMMENT_INPUT_PROPS}
          showCharacterCounter
          onChange={handleExpandedCommentChange}
          onClose={handleCloseCommentExpanded}
          specifiedLanguage="text"
        />
      )}
    </>
  );
});

HumanEvaluationModal.displayName = 'HumanEvaluationModal';

const WIDE_COLUMN_COUNT = 4;

/** @type {MuiSx} */
const humanEvaluationModalStyles = columnCount => ({
  dialogPaper: {
    width: columnCount === WIDE_COLUMN_COUNT ? '70rem' : '62.5rem',
    maxWidth: '95vw',
    height: '80vh',
  },
  // BaseModal pads its content with `!important` and caps its height against the viewport; the
  // paper owns the height here, and the case columns scroll internally.
  dialogContent: {
    padding: '0 !important',
    maxHeight: 'none',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  guidance: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 1.5rem',
  },
  guidanceTitle: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  guidanceText: ({ palette }) => ({
    color: palette.text.default,
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  }),
  columnsContainer: ({ palette }) => ({
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: palette.background.dataGrid.secondary,
    borderTop: `0.0625rem solid ${palette.border.lines}`,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  column: key => ({
    flex: columnCount === WIDE_COLUMN_COUNT ? 1 : (THREE_COLUMN_FLEX[key] ?? 1),
  }),
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    padding: '1rem 1.5rem 1.25rem 1.5rem',
    flexShrink: 0,
  },
  commentField: {
    position: 'relative',
    display: 'flex',
    flex: 1,
    minWidth: 0,
    '&:hover .comment-expand-action, &:focus-within .comment-expand-action': {
      opacity: 1,
    },
  },
  commentExpandButton: {
    position: 'absolute',
    top: '-0.25rem',
    right: 0,
    opacity: 0,
    transition: 'opacity 0.2s ease',
  },
  iconButton: {
    minWidth: 'unset',
    padding: '0.25rem',
  },
  expandIcon: {
    width: '1rem',
    height: '1rem',
  },
});

export default HumanEvaluationModal;
