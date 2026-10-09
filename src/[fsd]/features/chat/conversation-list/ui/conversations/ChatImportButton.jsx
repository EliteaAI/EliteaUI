import { memo } from 'react';

import { Box } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ImportIcon from '@/assets/import-icon.svg?react';
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const ChatImportButton = memo(props => {
  const { iconOnly = false, onClick } = props;

  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();

  if (projectId == PUBLIC_PROJECT_ID) return null;

  const canImport = checkPermission(PERMISSIONS.chat.create);

  return (
    <StyledTooltip
      title={canImport ? 'Import' : "You don't have permission to import chats"}
      placement="top"
    >
      <Box component="span">
        {iconOnly ? (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            onClick={onClick}
            disabled={!canImport}
            data-testid="chat-import-button"
            aria-label="Import"
          >
            <ImportIcon />
          </Button.BaseBtn>
        ) : (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.iconLabel}
            onClick={onClick}
            disabled={!canImport}
            data-testid="chat-import-button"
            startIcon={<ImportIcon />}
          >
            Import
          </Button.BaseBtn>
        )}
      </Box>
    </StyledTooltip>
  );
});

ChatImportButton.displayName = 'ChatImportButton';

export default ChatImportButton;
