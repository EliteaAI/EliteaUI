import { memo, useMemo } from 'react';

import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

import { useSkillVersionFileTextQuery } from '@/[fsd]/features/skill/api';
import { SKILL_FILE_PREVIEW_MAX_BYTES } from '@/[fsd]/features/skill/lib/constants';
import { fileBaseName, withoutByteOrderMark } from '@/[fsd]/features/skill/lib/helpers';
import { Button, Field } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { formatFileSize } from '@/common/attachmentValidationUtils';
import { buildErrorMessage } from '@/common/utils';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import FileCodeIcon from '@/components/Icons/FileCodeIcon';
import { markdown } from '@codemirror/lang-markdown';

import { SKILL_EDITOR_GUTTERS } from './skillEditorGutters.styles';

/**
 * The open file, read only: text in the team's code editor, fetched when it opens. A binary file, or a text file
 * too large for the editor, is a card with Download.
 */
const SkillFileViewer = memo(props => {
  const { file, scope, onDownload } = props;
  const theme = useTheme();
  const styles = skillFileViewerStyles();
  // Markdown files get the instructions' highlighting; scripts and text stay plain (no Python grammar in the app)
  const isMarkdown = /\.md$/i.test(file?.path || '');
  const extensions = useMemo(() => (isMarkdown ? [markdown()] : []), [isMarkdown]);
  const isEditable = Boolean(file?.isText) && file.size <= SKILL_FILE_PREVIEW_MAX_BYTES;
  const {
    currentData: content,
    isFetching,
    error,
  } = useSkillVersionFileTextQuery(
    { ...scope, path: file?.path },
    { skip: !file || !isEditable, refetchOnMountOrArgChange: true },
  );

  if (!file) return null;

  if (!isEditable)
    return (
      <Box
        sx={styles.card}
        data-testid="skill-file-binary"
      >
        <Box sx={styles.cardIcon}>
          <FileCodeIcon
            width={28}
            height={28}
          />
        </Box>
        <Typography
          variant="labelMedium"
          sx={styles.cardName}
        >
          {fileBaseName(file.path)}
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.cardText}
        >
          {file.isText
            ? `Text file · ${formatFileSize(file.size)}. Too large to show here.`
            : `Binary file · ${formatFileSize(file.size)}. The agent can pass it to a script, not read it.`}
        </Typography>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          startIcon={<DownloadIcon fill={theme.palette.icon.default} />}
          onClick={() => onDownload?.(file.path)}
        >
          Download
        </Button.BaseBtn>
      </Box>
    );

  if (content === undefined && isFetching)
    return (
      <Box sx={styles.state}>
        <CircularProgress size="1.5rem" />
      </Box>
    );

  if (error)
    return (
      <Box sx={styles.state}>
        <Typography
          variant="bodySmall"
          sx={styles.cardText}
          data-testid="skill-file-error"
        >
          {buildErrorMessage(error)}
        </Typography>
      </Box>
    );

  return (
    <Box
      sx={styles.editor}
      data-testid="skill-file-editor"
    >
      <Field.CodeMirrorEditor
        key={file.path}
        value={withoutByteOrderMark(content) ?? ''}
        extensions={extensions}
        height="100%"
        minHeight="0"
        readOnly
      />
    </Box>
  );
});

SkillFileViewer.displayName = 'SkillFileViewer';

/** @type {MuiSx} */
const skillFileViewerStyles = () => ({
  editor: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    display: 'flex',
    paddingTop: '0.75rem',
    '& .cm-theme': { width: '100%', minWidth: 0 },
    ...SKILL_EDITOR_GUTTERS(palette),
  }),
  state: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '5rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    paddingTop: '5rem',
    textAlign: 'center',
  },
  cardIcon: ({ palette }) => ({
    width: '4rem',
    height: '4rem',
    borderRadius: '0.875rem',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  cardName: ({ palette }) => ({ color: palette.text.secondary }),
  cardText: ({ palette }) => ({ color: palette.text.primary }),
});

export default SkillFileViewer;
