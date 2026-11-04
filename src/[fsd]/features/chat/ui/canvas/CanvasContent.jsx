import { memo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Button, Markdown } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { PERMISSIONS } from '@/common/constants';
import AuthorContainer from '@/components/AuthorContainer';
import CopyIcon from '@/components/Icons/CopyIcon';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import EditIcon from '@/components/Icons/EditIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

const CanvasContent = memo(props => {
  const {
    content,
    showEdit,
    selectedCodeBlockInfo,
    interaction_uuid,
    conversation_uuid,
    canvasId,
    isStreaming,
    onClickEdit,
    onClickCopy,
    onClickDownload,
    editButtonTitle = 'Edit Code',
    editors = [],
    editStatusTitle = 'is editing...',
  } = props;

  const { checkPermission } = useCheckPermission();
  const styles = canvasContentStyles();
  const theme = useTheme();
  const isEditDisabled = isStreaming || !checkPermission(PERMISSIONS.chat.canvas.update);

  return (
    <>
      <Box sx={styles.toolbar}>
        {editors.length > 0 && (
          <Box sx={styles.editorsRow}>
            <AuthorContainer
              authors={editors.map(item => ({ name: item.user_name, avatar: item.user_avatar }))}
              disabledNavigation
            />
            <Typography
              variant="bodySmall"
              color="text.primary"
            >
              {editStatusTitle}
            </Typography>
          </Box>
        )}
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
        {showEdit && (
          <Tooltip
            title={editors.length > 0 ? 'Watch editing' : editButtonTitle}
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.icon}
                disabled={isEditDisabled}
                onClick={onClickEdit}
              >
                <EditIcon
                  sx={styles.icon}
                  fill={isEditDisabled ? theme.palette.icon.disabled : theme.palette.icon.default}
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
            <CopyIcon sx={styles.copyIcon} />
          </Button.BaseBtn>
        </Tooltip>
      </Box>
      <Markdown
        interaction_uuid={interaction_uuid}
        conversation_uuid={conversation_uuid}
        selectedCodeBlockInfo={selectedCodeBlockInfo}
        canvasId={canvasId}
        isStreaming={isStreaming}
        showToolbar={false}
      >
        {content || ' '}
      </Markdown>
    </>
  );
});

CanvasContent.displayName = 'CanvasContent';

/** @type {MuiSx} */
const canvasContentStyles = () => ({
  toolbar: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '0.5rem 0 0.5rem 0.5rem',
    gap: '0.5rem',
  },
  editorsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '0.5rem',
    marginRight: 'auto',
  },
  icon: { fontSize: '1rem' },
  copyIcon: {
    fontSize: '1rem',
  },
});

export default CanvasContent;
