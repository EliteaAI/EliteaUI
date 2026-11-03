import { memo, useCallback } from 'react';

import { Box, Tooltip } from '@mui/material';

import { useToast } from '@/[fsd]/shared/lib/hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import FullscreenOutlinedIcon from '@/assets/full-screen-icon.svg?react';
import { handleCopy } from '@/common/utils';
import CopyIcon from '@/components/Icons/CopyIcon';

const MarkdownEditorActions = memo(props => {
  const {
    value = '',
    onFullScreen,
    copyMessage = 'The content has been copied to the clipboard.',
    testIdPrefix = 'markdown-editor',
    sx,
  } = props;

  const { toastInfo } = useToast();
  const styles = markdownEditorActionsStyles();

  const onCopy = useCallback(() => {
    handleCopy(value);
    toastInfo(copyMessage);
  }, [copyMessage, toastInfo, value]);

  return (
    <Box sx={[styles.root, sx]}>
      <Tooltip
        title="Copy to clipboard"
        placement="top"
      >
        <Box component="span">
          <BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            disabled={!value}
            startIcon={<CopyIcon sx={styles.icon} />}
            onClick={onCopy}
            aria-label="Copy to clipboard"
            data-testid={`${testIdPrefix}-copy`}
          />
        </Box>
      </Tooltip>
      <Tooltip
        title="Full screen view"
        placement="top"
      >
        <Box component="span">
          <BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={<FullscreenOutlinedIcon />}
            onClick={onFullScreen}
            aria-label="Full screen view"
            data-testid={`${testIdPrefix}-full-screen`}
          />
        </Box>
      </Tooltip>
    </Box>
  );
});

MarkdownEditorActions.displayName = 'MarkdownEditorActions';

/** @type {MuiSx} */
const markdownEditorActionsStyles = () => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  icon: {
    fontSize: '1rem',
  },
});

export default MarkdownEditorActions;
