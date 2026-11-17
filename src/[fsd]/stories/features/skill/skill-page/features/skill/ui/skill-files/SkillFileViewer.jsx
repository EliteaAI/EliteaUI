import { memo, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { SKILL_FILE_ACTIONS } from '@/[fsd]/features/skill/lib/constants';
import { fileBaseName, fileMetaLabel } from '@/[fsd]/features/skill/lib/helpers';
import { Button, Field } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import FileCodeIcon from '@/components/Icons/FileCodeIcon';
import { markdown } from '@codemirror/lang-markdown';

import { SKILL_EDITOR_GUTTERS } from './skillEditorGutters.styles';

/**
 * The open file: text in the team's code editor, a binary file as a card with Download.
 */
const SkillFileViewer = memo(props => {
  const { file, onAction, disabled } = props;
  const theme = useTheme();
  const styles = skillFileViewerStyles();
  // Markdown files get the instructions' highlighting; scripts and text stay plain (no Python grammar in the app)
  const isMarkdown = /\.md$/i.test(file?.path || '');
  const extensions = useMemo(() => (isMarkdown ? [markdown()] : []), [isMarkdown]);

  if (!file) return null;

  if (file.binary)
    return (
      <Box
        sx={styles.binary}
        data-testid="skill-file-binary"
      >
        <Box sx={styles.binaryIcon}>
          <FileCodeIcon
            width={28}
            height={28}
          />
        </Box>
        <Typography
          variant="labelMedium"
          sx={styles.binaryName}
        >
          {fileBaseName(file.path)}
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.binaryText}
        >
          Binary file · {fileMetaLabel(file)}. The agent can pass it to a script, not read it.
        </Typography>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          startIcon={<DownloadIcon fill={theme.palette.icon.default} />}
          onClick={() => onAction?.(SKILL_FILE_ACTIONS.download, file.path)}
        >
          Download
        </Button.BaseBtn>
      </Box>
    );

  return (
    <Box
      sx={styles.editor}
      data-testid="skill-file-editor"
    >
      <Field.CodeMirrorEditor
        key={file.path}
        value={file.content || ''}
        extensions={extensions}
        height="100%"
        minHeight="0"
        readOnly={disabled}
      />
    </Box>
  );
});

SkillFileViewer.displayName = 'SkillFileViewer';

/** @type {MuiSx} */
const skillFileViewerStyles = () => ({
  // The same as the instructions beside it: 12px above the text, the line numbers from the column edge
  editor: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    display: 'flex',
    paddingTop: '0.75rem',
    '& .cm-theme': { width: '100%', minWidth: 0 },
    ...SKILL_EDITOR_GUTTERS(palette),
  }),
  binary: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    paddingTop: '5rem',
    textAlign: 'center',
  },
  binaryIcon: ({ palette }) => ({
    width: '4rem',
    height: '4rem',
    borderRadius: '0.875rem',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  binaryName: ({ palette }) => ({ color: palette.text.secondary }),
  binaryText: ({ palette }) => ({ color: palette.text.primary }),
});

export default SkillFileViewer;
