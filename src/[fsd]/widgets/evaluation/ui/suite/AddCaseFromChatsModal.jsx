import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { format, parseISO } from 'date-fns';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import CheckIcon from '@/components/Icons/CheckIcon';

import { useEvalConversationsQuery, usePromoteEvalDatasetMutation } from '../../api';
import { PROMOTE_CONVERSATION_SOURCE } from '../../lib/constants';
import { parseEvalError } from '../../lib/helpers';

const getRowDate = row => row.updated_at || row.created_at;

const formatConversationDate = value => {
  if (!value) return '';
  try {
    const date = typeof value === 'string' ? parseISO(value) : new Date(value);
    return format(date, 'd MMM yyyy – HH:mm');
  } catch {
    return '';
  }
};

const AddCaseFromChatsModal = memo(props => {
  const { open, onClose, projectId, datasetId, applicationId = null } = props;

  const [search, setSearch] = useState('');
  const [source, setSource] = useState(PROMOTE_CONVERSATION_SOURCE.chat);
  const [selectedIds, setSelectedIds] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const isRunHistory = source === PROMOTE_CONVERSATION_SOURCE.runHistory;

  const { data, isFetching } = useEvalConversationsQuery(
    { projectId, search, source, applicationId: isRunHistory ? applicationId : null },
    { skip: !open || !projectId },
  );

  const [promote, { isLoading: isPromoting }] = usePromoteEvalDatasetMutation();

  useEffect(() => {
    if (open) {
      setSearch('');
      setSource(PROMOTE_CONVERSATION_SOURCE.chat);
      setSelectedIds([]);
      setErrorMessage('');
    }
  }, [open]);

  const rows = useMemo(() => {
    const items = data?.rows ?? [];
    return [...items].sort((a, b) => {
      const dateA = new Date(getRowDate(a) || 0);
      const dateB = new Date(getRowDate(b) || 0);
      return dateB - dateA;
    });
  }, [data?.rows]);

  const handleChangeSource = useCallback((_, newValue) => {
    if (newValue === null) return;
    setSource(newValue);
    setSelectedIds([]);
    setErrorMessage('');
  }, []);

  const handleSearchChange = useCallback(value => {
    setSearch(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearch('');
  }, []);

  const handleToggleRow = useCallback(id => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  }, []);

  const handleAdd = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setErrorMessage('');
    try {
      for (const conversationId of selectedIds) {
        await promote({
          projectId,
          datasetId,
          body: { conversation_id: conversationId, include_expected: true },
        }).unwrap();
      }
      onClose();
    } catch (error) {
      setErrorMessage(parseEvalError(error, 'Failed to add cases from conversation.'));
    }
  }, [selectedIds, promote, projectId, datasetId, onClose]);

  const selectedCount = selectedIds.length;

  const styles = addCaseFromChatsModalStyles();

  const content = (
    <Box sx={styles.content}>
      <Box sx={styles.header}>
        <BaseTabs
          value={source}
          onChange={handleChangeSource}
          sx={styles.tabs}
        >
          <BaseTab
            value={PROMOTE_CONVERSATION_SOURCE.chat}
            label="Chats"
          />
          <BaseTab
            value={PROMOTE_CONVERSATION_SOURCE.runHistory}
            label="History Runs"
          />
        </BaseTabs>
        <Input.SimpleSearchBar
          searchQuery={search}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
          autoFocus={false}
          sx={styles.searchBar}
          data-testid="add-case-chats-search"
        />
      </Box>

      {isRunHistory && !applicationId && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={styles.noAgentText}
        >
          Open this dialog from an agent to browse its run history.
        </Typography>
      )}

      <Box
        sx={styles.list}
        data-testid="add-case-chats-list"
      >
        {isFetching ? (
          <Box sx={styles.centered}>
            <CircularProgress size={20} />
          </Box>
        ) : rows.length === 0 ? (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={styles.emptyText}
          >
            {isRunHistory ? 'No run-history conversations found for this agent.' : 'No conversations found.'}
          </Typography>
        ) : (
          rows.map(row => {
            const isSelected = selectedIds.includes(row.id);
            const dateValue = getRowDate(row);
            return (
              <Box
                key={row.id}
                sx={styles.row(isSelected)}
                onClick={() => handleToggleRow(row.id)}
                data-testid={`add-case-chat-${row.id}`}
              >
                <Box sx={styles.rowContent}>
                  <Typography
                    variant="bodyMedium"
                    sx={styles.rowName}
                  >
                    {row.name || `Conversation #${row.id}`}
                  </Typography>
                  {dateValue && (
                    <Typography
                      variant="bodySmall"
                      sx={styles.rowDate}
                    >
                      {formatConversationDate(dateValue)}
                    </Typography>
                  )}
                </Box>
                {isSelected && <CheckIcon sx={styles.checkIcon} />}
              </Box>
            );
          })
        )}
      </Box>

      {errorMessage && (
        <Typography
          data-testid="add-case-chats-error"
          variant="bodySmall"
          sx={styles.error}
        >
          {errorMessage}
        </Typography>
      )}
    </Box>
  );

  const footer = (
    <Box sx={styles.footer}>
      <Typography
        variant="bodySmall"
        sx={styles.selectedCount}
      >
        {selectedCount} selected
      </Typography>
      <Box sx={styles.actionButtons}>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.secondary}
          onClick={onClose}
        >
          Cancel
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          disabled={isPromoting || selectedCount === 0}
          onClick={handleAdd}
          data-testid="add-case-chats-submit"
        >
          Add
        </Button.BaseBtn>
      </Box>
    </Box>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Add Case"
      onClose={onClose}
      content={content}
      footer={footer}
      dialogSx={styles.dialog}
      data-testid="add-case-from-chats-modal"
    />
  );
});

AddCaseFromChatsModal.displayName = 'AddCaseFromChatsModal';

/** @type {MuiSx} */
const addCaseFromChatsModalStyles = () => ({
  dialog: {
    minHeight: '30.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexShrink: 0,
    paddingBottom: '1rem',
  },
  tabs: {
    minHeight: 'unset',
    '& .MuiTabs-indicator': {
      height: '0.125rem',
    },
  },
  searchBar: ({ palette }) => ({
    maxWidth: '14rem',
    flexShrink: 0,
    color: palette.text.secondary,
    '& svg': {
      color: palette.text.primary,
    },
  }),
  noAgentText: {
    padding: '0.5rem 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    marginLeft: '-1.5rem',
    marginRight: '-1.5rem',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    flex: 1,
  },
  emptyText: {
    padding: '2rem',
    textAlign: 'center',
  },
  row:
    isSelected =>
    ({ palette }) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 1.5rem',
      cursor: 'pointer',
      backgroundColor: isSelected ? palette.background.conversation.selected : 'transparent',

      '&:hover': {
        backgroundColor: isSelected
          ? palette.background.conversation.selected
          : palette.background.conversation.hover,
      },
    }),
  rowContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
    flex: 1,
  },
  rowName: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  rowDate: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.75rem',
  }),
  checkIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    flexShrink: 0,
    marginLeft: '0.75rem',
    color: palette.text.secondary,
    '& path': {
      fill: palette.text.secondary,
    },
  }),
  error: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
    padding: '0.5rem 0',
  }),
  footer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    padding: '0.75rem 1.5rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  selectedCount: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.875rem',
  }),
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default AddCaseFromChatsModal;
