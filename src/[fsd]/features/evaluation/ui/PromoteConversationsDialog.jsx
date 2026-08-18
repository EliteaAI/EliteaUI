import { memo, useCallback, useEffect, useState } from 'react';

import { Box, CircularProgress, FormControlLabel, TextField, Typography } from '@mui/material';

import { Button, Checkbox, Modal, Tab } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { useEvalConversationsQuery, usePromoteEvalDatasetMutation } from '../api';
import { PROMOTE_CONVERSATION_SOURCE, PROMOTE_CONVERSATION_SOURCE_OPTIONS } from '../lib/constants';
import { parseEvalError } from '../lib/helpers';

const PromoteConversationsDialog = memo(props => {
  const { open, onClose, projectId, datasetId, applicationId = null } = props;

  const [search, setSearch] = useState('');
  const [source, setSource] = useState(PROMOTE_CONVERSATION_SOURCE.chat);
  const [selectedId, setSelectedId] = useState(null);
  const [includeExpected, setIncludeExpected] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const isRunHistory = source === PROMOTE_CONVERSATION_SOURCE.runHistory;

  // Run history is only meaningful scoped to the agent it belongs to; chat
  // conversations stay project-wide.
  const { data, isFetching } = useEvalConversationsQuery(
    { projectId, search, source, applicationId: isRunHistory ? applicationId : null },
    { skip: !open || !projectId },
  );

  const handleChangeSource = useCallback((event, newValue) => {
    setSource(newValue);
    setSelectedId(null);
    setErrorMessage('');
  }, []);

  const [promote, { isLoading: isPromoting }] = usePromoteEvalDatasetMutation();

  useEffect(() => {
    if (open) {
      setSearch('');
      setSource(PROMOTE_CONVERSATION_SOURCE.chat);
      setSelectedId(null);
      setIncludeExpected(true);
      setErrorMessage('');
    }
  }, [open]);

  const rows = data?.rows ?? [];

  const handlePromote = useCallback(async () => {
    if (selectedId == null) {
      setErrorMessage('Select a conversation to promote.');
      return;
    }
    setErrorMessage('');
    try {
      await promote({
        projectId,
        datasetId,
        body: { conversation_id: selectedId, include_expected: includeExpected },
      }).unwrap();
      onClose();
    } catch (error) {
      setErrorMessage(parseEvalError(error, 'Failed to promote conversation.'));
    }
  }, [selectedId, promote, projectId, datasetId, includeExpected, onClose]);

  const styles = promoteConversationsDialogStyles();

  const content = (
    <Box sx={styles.content}>
      <Box
        sx={styles.sourceToggle}
        data-testid="promote-source-toggle"
      >
        <Tab.TabGroupButton
          arrayBtn={PROMOTE_CONVERSATION_SOURCE_OPTIONS}
          value={source}
          onChange={handleChangeSource}
          disableTooltip
        />
      </Box>

      {isRunHistory && !applicationId && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          Open this dialog from an agent to browse its run history.
        </Typography>
      )}

      <TextField
        data-testid="promote-search-input"
        fullWidth
        variant="standard"
        label="Search conversations"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />

      <Box
        sx={styles.list}
        data-testid="promote-conversation-list"
      >
        {isFetching ? (
          <Box sx={styles.centered}>
            <CircularProgress size={20} />
          </Box>
        ) : rows.length === 0 ? (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {isRunHistory ? 'No run-history conversations found for this agent.' : 'No conversations found.'}
          </Typography>
        ) : (
          rows.map(row => (
            <Box
              key={row.id}
              sx={styles.row(row.id === selectedId)}
              onClick={() => setSelectedId(row.id)}
              data-testid={`promote-conversation-${row.id}`}
            >
              <Typography variant="bodyMedium">{row.name || `Conversation #${row.id}`}</Typography>
              {row.created_at && (
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                >
                  {row.created_at}
                </Typography>
              )}
            </Box>
          ))
        )}
      </Box>

      <FormControlLabel
        control={
          <Checkbox.BaseCheckbox
            checked={includeExpected}
            onChange={event => setIncludeExpected(event.target.checked)}
            data-testid="promote-include-expected"
          />
        }
        label="Use assistant replies as expected output"
      />

      {errorMessage && (
        <Typography
          data-testid="promote-error"
          variant="bodySmall"
          sx={styles.error}
        >
          {errorMessage}
        </Typography>
      )}
    </Box>
  );

  const actions = (
    <>
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
        disabled={isPromoting || selectedId == null}
        onClick={handlePromote}
        data-testid="promote-submit"
      >
        Promote
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Promote conversation to cases"
      onClose={onClose}
      content={content}
      actions={actions}
      data-testid="promote-conversations-dialog"
    />
  );
});

PromoteConversationsDialog.displayName = 'PromoteConversationsDialog';

/** @type {MuiSx} */
const promoteConversationsDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '32rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '18rem',
    overflowY: 'auto',
  },
  sourceToggle: {
    display: 'flex',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem',
  },
  row:
    isSelected =>
    ({ palette }) => ({
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      border: `0.0625rem solid ${isSelected ? palette.primary.main : palette.border.lines}`,
      backgroundColor: isSelected ? palette.background.tabButton.active : 'transparent',
      '&:hover': {
        backgroundColor: palette.background.tabButton.default,
      },
    }),
  error: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
  }),
});

export default PromoteConversationsDialog;
