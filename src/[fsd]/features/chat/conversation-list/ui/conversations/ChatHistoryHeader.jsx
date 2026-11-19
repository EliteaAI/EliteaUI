import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import SearchIcon from '@/assets/search-icon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import CloseIcon from '@/components/Icons/CloseIcon';
import NewFolder from '@/components/Icons/NewFolder';
import useCheckPermission from '@/hooks/useCheckPermission';

import ChatImportButton from './ChatImportButton';

const ChatHistoryHeader = memo(props => {
  const {
    isSearchActive,
    searchQuery,
    onSearchActivate,
    onSearchChange,
    onSearchClear,
    onCreateFolder,
    onImport,
  } = props;

  const { checkPermission } = useCheckPermission();
  const canCreateFolder = checkPermission(PERMISSIONS.chat.folders.create);

  const styles = chatHistoryHeaderStyles();

  return (
    <>
      <Box sx={styles.header}>
        <Typography
          data-testid="chat-conversations-heading"
          variant="subtitle"
        >
          Chats
        </Typography>
        <Box sx={styles.actions}>
          <Tooltip
            title="Search chats"
            placement="top"
          >
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              data-testid="conversation-search-button"
              aria-label="Search chats"
              onClick={onSearchActivate}
              startIcon={<SearchIcon />}
            />
          </Tooltip>
          <Tooltip
            title="Create folder"
            placement="top"
          >
            <Box
              component="span"
              sx={styles.tooltipAnchor}
            >
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                data-testid="chat-create-folder-button"
                aria-label="Create folder"
                disabled={!canCreateFolder}
                onClick={onCreateFolder}
                startIcon={<NewFolder />}
              />
            </Box>
          </Tooltip>
          <ChatImportButton
            iconOnly
            onClick={onImport}
          />
        </Box>
      </Box>
      {isSearchActive && (
        <Box sx={styles.searchBar}>
          <SimpleSearchBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onSearchClear={onSearchClear}
            placeholder="Search chats..."
            data-testid="conversation-search-input"
          />
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            data-testid="conversation-search-clear-button"
            aria-label="Close search"
            onClick={onSearchClear}
            startIcon={<CloseIcon />}
          />
        </Box>
      )}
    </>
  );
});

ChatHistoryHeader.displayName = 'ChatHistoryHeader';

/** @type {MuiSx} */
const chatHistoryHeaderStyles = () => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '2rem',
    flexShrink: 0,
    paddingLeft: '0.5rem',
  },
  // The three 28 px round tertiary buttons, 4 px apart; their icon colours come from the button theme
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  tooltipAnchor: {
    display: 'flex',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
    padding: '0.5rem 0 0.25rem',
  },
});

export default ChatHistoryHeader;
