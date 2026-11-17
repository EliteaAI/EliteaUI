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
  skillInstructionsDecorations,
} from '@/[fsd]/features/skill/lib/helpers';
import {
  useSkillFrontmatterEditor,
  useSkillInstructionsMaxLength,
  useSkillModels,
} from '@/[fsd]/features/skill/lib/hooks';
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

/**
 * The instructions column: "Instructions (SKILL.md)" with its actions, the text in the team's editor and,
 * in Settings, the Files line under it. Paths of the skill's files are links that open the file; beside an
 * open file the lines that mention it are marked, and a file the instructions never mention gets a warning.
 */
const SkillInstructionsPane = memo(props => {
  const {
    files = NO_FILES,
    openPath,
    showViewToggle = false,
    showFilesBar = false,
    disabled,
    headerActions,
    onOpenFile,
    onOpenFiles,
    onAddFiles,
    onClose,
    // Takes the text's own height and leaves the scroll to the column around it (a narrow window)
    fitContent = false,
    sx,
  } = props;

  const theme = useTheme();
  const formik = useFormikContext();
  const { models } = useSkillModels();
  const { editorText, onEditorChange } = useSkillFrontmatterEditor({ models });
  const maxLength = useSkillInstructionsMaxLength();
  const instructions = formik.values?.version_details?.instructions || '';
  const overBy = instructions.length - maxLength;
  // The same words as the instructions field had in Settings (CreateSkillForm)
  const counterLabel = overBy > 0 ? `${overBy} characters over the limit` : `${-overBy} characters left`;
  // Figma "Settings tab_Instructions view": the text opens rendered, </> switches to the editor
  const [viewMode, setViewMode] = useState(MARKDOWN_VIEW_MODES.preview);
  const isPreview = showViewToggle && viewMode === MARKDOWN_VIEW_MODES.preview;

  const styles = skillInstructionsPaneStyles({ fitContent });

  const paths = useMemo(() => files.map(file => file.path), [files]);
  const markedLines = useMemo(() => findMentionLines(editorText, openPath), [editorText, openPath]);
  const isUnmentioned = Boolean(openPath) && !markedLines.length;

  const extensions = useMemo(
    () => [markdown(), skillInstructionsDecorations({ paths, markedLines, onOpenFile })],
    [markedLines, onOpenFile, paths],
  );

  // Copy, as dev's MarkdownEditorActions draws it (no full screen: her decision, 17.11). Settings: only in the code
  // view, left of Test. Files: beside ✕, across a divider.
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
            data-testid="skill-instructions-preview"
          >
            <Markdown>{instructions}</Markdown>
          </Box>
        ) : (
          <Box
            sx={styles.editor}
            data-testid="skill-instructions-editor"
          >
            <Field.CodeMirrorEditor
              value={editorText}
              notifyChange={onEditorChange}
              onBlur={onBlur}
              extensions={extensions}
              height="100%"
              minHeight="0"
              countLength={countSkillBodyLength}
              readOnly={disabled}
              contentTestId="skill-instructions-editor-content"
            />
          </Box>
        )}
      </Box>
      {/* The counter belongs to the editor: the rendered text has none */}
      {!isPreview && (
        <Typography
          variant="bodySmall"
          sx={styles.counter}
          data-testid="skill-instructions-counter"
        >
          {counterLabel}
        </Typography>
      )}
      {showFilesBar && (
        <SkillFilesBar
          files={files}
          onOpen={onOpenFiles}
          onAdd={onAddFiles}
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
  // The same divider as before ✕ in the Test header (TestPanelCloseButton)
  divider: ({ palette }) => ({
    marginY: '0.25rem',
    borderColor: palette.border.lines,
  }),
  // The counter's own 12px below it is the gap to the card
  filesBar: {
    paddingTop: 0,
  },
  // Under the text, at the right edge; 12px grey (Figma: DT/gray_20 #686C76 in the dark theme)
  counter: ({ palette }) => ({
    flexShrink: 0,
    alignSelf: 'flex-end',
    padding: '0.75rem 1.5rem',
    color: palette.text.muted,
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
    fontSize: '0.875rem',
    color: palette.text.secondary,
    '& p, & li, & ol, & ul, & h1, & h2, & h3, & h4, & h5, & h6, & strong, & em, & td, & th': {
      color: palette.text.secondary,
    },
  }),
});

export default SkillInstructionsPane;
