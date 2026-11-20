import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Divider, Tooltip, Typography, useTheme } from '@mui/material';

import { SKILL_MD_FILE_NAME } from '@/[fsd]/features/skill/lib/constants';
import {
  FILE_LINK_CLASS,
  MENTION_LINE_CLASS,
  countSkillBodyLength,
  fileBaseName,
  findMentionLines,
  resolveFileLink,
  skillInstructionsDecorations,
} from '@/[fsd]/features/skill/lib/helpers';
import { useSkillInstructionsMaxLength } from '@/[fsd]/features/skill/lib/hooks';
import { MarkdownConstants } from '@/[fsd]/shared/lib/constants';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Banner, Button, Field, Markdown } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { MarkdownViewToggle } from '@/[fsd]/shared/ui/tab-group-button';
import { handleCopy } from '@/common/utils';
import CloseIcon from '@/components/Icons/CloseIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import { markdown } from '@codemirror/lang-markdown';

import SkillFilesBar from './SkillFilesBar';
import SkillPaneHeader from './SkillPaneHeader';
import { SKILL_EDITOR_GUTTERS } from './skillEditorGutters.styles';

const { MARKDOWN_VIEW_MODES } = MarkdownConstants;
const PREVIEW_FIRST = [MARKDOWN_VIEW_MODES.preview, MARKDOWN_VIEW_MODES.edit];
const NO_FILES = [];
const NO_ERRORS = [];
const MARKDOWN_LANGUAGE = markdown();

/**
 * The instructions column: "Instructions (SKILL.md)" with its actions, the text in the team's editor (its state
 * comes from the page, which outlives this column) and,
 * in Settings, the Files line under it. Paths of the skill's files are links that open the file; beside an
 * open file the lines that mention it are marked, and a file the instructions never mention gets a warning.
 */
const SkillInstructionsPane = memo(props => {
  const {
    files = NO_FILES,
    editorText = '',
    frontmatterErrors = NO_ERRORS,
    onEditorChange,
    openPath,
    instructionsKey,
    showViewToggle = false,
    showFilesBar = false,
    readOnlyFiles = false,
    disabled,
    headerActions,
    onOpenFile,
    onOpenFiles,
    onAddFiles,
    onClose,
    fitContent = false,
    sx,
  } = props;

  const theme = useTheme();
  const formik = useFormikContext();
  const maxLength = useSkillInstructionsMaxLength();
  const instructions = formik.values?.version_details?.instructions || '';
  const overBy = instructions.length - maxLength;
  const isNearLimit = instructions.length >= maxLength * 0.9;
  const counterLabel = overBy > 0 ? `${overBy} characters over the limit` : `${-overBy} characters left`;
  const instructionsError =
    formik.touched?.version_details?.instructions && formik.errors?.version_details?.instructions;
  const [viewMode, setViewMode] = useState(MARKDOWN_VIEW_MODES.preview);
  const isPreview = showViewToggle && viewMode === MARKDOWN_VIEW_MODES.preview;

  const styles = skillInstructionsPaneStyles({ fitContent });

  const paths = useMemo(() => files.map(file => file.path), [files]);
  const isUnmentioned = useMemo(
    () => Boolean(openPath) && !findMentionLines(editorText, openPath).length,
    [editorText, openPath],
  );

  const extensions = useMemo(
    () => [MARKDOWN_LANGUAGE, skillInstructionsDecorations({ paths, openPath, onOpenFile })],
    [onOpenFile, openPath, paths],
  );

  const { toastInfo } = useToast();
  const onCopy = useCallback(() => {
    handleCopy(editorText);
    toastInfo('The instructions have been copied to the clipboard.');
  }, [editorText, toastInfo]);
  const showCopy = onClose ? true : showViewToggle && !isPreview;
  const copyButton = showCopy && (
    <Tooltip
      title="Copy to clipboard"
      placement="top"
    >
      <Box component="span">
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          disabled={!editorText}
          startIcon={<CopyIcon sx={styles.copyIcon} />}
          onClick={onCopy}
          aria-label="Copy to clipboard"
          data-testid="skill-instructions-copy"
        />
      </Box>
    </Tooltip>
  );

  const onBlur = useCallback(() => formik.setFieldTouched('version_details.instructions', true), [formik]);

  const onPreviewClick = useCallback(
    event => {
      const link = event.target.closest?.('a');
      const file = link && resolveFileLink(files, link.getAttribute('href'));
      if (!file || !onOpenFile) return;
      event.preventDefault();
      event.stopPropagation();
      onOpenFile(file.path);
    },
    [files, onOpenFile],
  );

  return (
    <Box
      sx={[styles.root, sx]}
      data-testid="skill-instructions-pane"
    >
      <SkillPaneHeader
        title="Instructions"
        subtitle={`(${SKILL_MD_FILE_NAME})`}
        testId="skill-instructions-header"
      >
        {!onClose && copyButton}
        {headerActions}
        {showViewToggle && (
          <MarkdownViewToggle
            value={viewMode}
            onChange={setViewMode}
            iconOrder={PREVIEW_FIRST}
          />
        )}
        {onClose && copyButton}
        {onClose && (
          <Divider
            orientation="vertical"
            flexItem
            sx={styles.divider}
          />
        )}
        {onClose && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={<CloseIcon fill={theme.palette.icon.default} />}
            onClick={onClose}
            aria-label="Close the instructions"
            title="Close"
            data-testid="skill-instructions-close"
          />
        )}
      </SkillPaneHeader>
      <Box sx={styles.body}>
        {overBy > 0 && (
          <Banner.BannerMessage
            variant="error"
            containerSx={styles.banner}
          >
            <Typography variant="bodySmall">
              {`${overBy.toLocaleString('en-US')} characters over the limit of ${maxLength.toLocaleString('en-US')} — Save is blocked until the instructions are shorter.`}
            </Typography>
          </Banner.BannerMessage>
        )}
        {isUnmentioned && (
          <Banner.BannerMessage
            variant="warning"
            containerSx={styles.banner}
          >
            <Typography variant="bodySmall">
              {`${fileBaseName(openPath)} isn’t mentioned in the instructions — the agent may never open it.`}
            </Typography>
          </Banner.BannerMessage>
        )}
        {isPreview ? (
          <Box
            sx={styles.preview}
            onClickCapture={onPreviewClick}
            data-testid="skill-instructions-preview"
          >
            {instructions ? (
              <Markdown>{instructions}</Markdown>
            ) : (
              <Typography
                variant="bodyMedium"
                sx={styles.emptyPreview}
              >
                No instructions yet.
              </Typography>
            )}
          </Box>
        ) : (
          <Box
            sx={styles.editor}
            data-testid="skill-instructions-editor"
          >
            <Field.CodeMirrorEditor
              key={instructionsKey}
              value={editorText}
              notifyChange={onEditorChange}
              onBlur={onBlur}
              extensions={extensions}
              height="100%"
              minHeight="0"
              maxLength={maxLength}
              countLength={countSkillBodyLength}
              readOnly={disabled}
              contentTestId="skill-instructions-editor-content"
            />
          </Box>
        )}
      </Box>
      {(instructionsError || frontmatterErrors.length > 0 || !isPreview) && (
        <Box sx={styles.footer}>
          <Box sx={styles.errors}>
            {instructionsError && (
              <Typography
                variant="bodySmall"
                sx={styles.error}
                data-testid="skill-instructions-error"
              >
                {instructionsError}
              </Typography>
            )}
            {!isPreview &&
              frontmatterErrors.map(error => (
                <Typography
                  key={error}
                  variant="bodySmall"
                  sx={styles.error}
                  data-testid="skill-frontmatter-error"
                >
                  {error}
                </Typography>
              ))}
          </Box>
          {!isPreview && (
            <Typography
              variant="bodySmall"
              sx={styles.counter}
              data-near-limit={isNearLimit}
              data-testid="skill-instructions-counter"
            >
              {counterLabel}
            </Typography>
          )}
        </Box>
      )}
      {showFilesBar && (
        <SkillFilesBar
          files={files}
          onOpen={onOpenFiles}
          onAdd={readOnlyFiles ? undefined : onAddFiles}
          sx={isPreview ? undefined : styles.filesBar}
        />
      )}
    </Box>
  );
});

SkillInstructionsPane.displayName = 'SkillInstructionsPane';

/** @type {MuiSx} */
const skillInstructionsPaneStyles = ({ fitContent }) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
  },
  body: {
    flex: fitContent ? '0 0 auto' : 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingTop: '0.75rem',
    overflowY: fitContent ? 'visible' : 'auto',
  },
  banner: {
    margin: '0 1.5rem',
  },
  copyIcon: {
    fontSize: '1rem',
  },
  divider: ({ palette }) => ({
    marginY: '0.25rem',
    borderColor: palette.border.lines,
  }),
  filesBar: {
    paddingTop: 0,
  },
  footer: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
  },
  errors: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  error: ({ palette }) => ({
    color: palette.error.main,
  }),
  counter: ({ palette }) => ({
    flexShrink: 0,
    color: palette.text.muted,
    '&[data-near-limit="true"]': { color: palette.warning.main },
  }),
  emptyPreview: ({ palette }) => ({
    color: palette.text.primary,
  }),
  editor: ({ palette }) => ({
    flex: 1,
    minHeight: fitContent ? '20rem' : 0,
    minWidth: 0,
    display: 'flex',
    '& .cm-theme': { width: '100%', minWidth: 0 },
    '& .cm-content': { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
    ...SKILL_EDITOR_GUTTERS(palette),
    [`& .${MENTION_LINE_CLASS}`]: { backgroundColor: palette.background.selectedItem.default },
    [`& .${FILE_LINK_CLASS}`]: {
      color: palette.text.accent,
      textDecoration: 'underline',
      cursor: 'pointer',
    },
  }),
  preview: ({ palette }) => ({
    padding: '0 1.5rem 1rem 2rem',
    overflowWrap: 'anywhere',
    fontSize: '0.875rem',
    color: palette.text.secondary,
    '& p, & li, & ol, & ul, & h1, & h2, & h3, & h4, & h5, & h6, & strong, & em, & td, & th': {
      color: palette.text.secondary,
    },
  }),
});

export default SkillInstructionsPane;
