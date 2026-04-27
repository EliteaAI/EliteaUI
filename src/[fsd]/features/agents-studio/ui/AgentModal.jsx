import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';

import { ConfigurationModal } from '@/[fsd]/features/agent/ui/agent-details/configurations';
import AgentConversationStarters from '@/[fsd]/features/agents-studio/ui/AgentConversationStarters';
import AgentStudioLike from '@/[fsd]/features/agents-studio/ui/AgentStudioLike';
import AgentWelcomeMessage from '@/[fsd]/features/agents-studio/ui/AgentWelcomeMessage';
import { useLazyPublicApplicationDetailsQuery } from '@/api';
import { ChatParticipantType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import AuthorContainer from '@/components/AuthorContainer';
import { CopyLinkToEntityButton } from '@/components/CopyLinkToEntityButton';
import EntityIcon from '@/components/EntityIcon';
import CloseIcon from '@/components/Icons/CloseIcon';
import RouteDefinitions, { getBasename } from '@/routes';
import { actions } from '@/slices/chat';

import { AgentsStudioConstants } from '../lib/constants';

const getCardAuthors = (agent, agentDetails) => {
  const { authors = [], author = {} } = agent || {};
  if (authors?.length) {
    return authors;
  } else {
    if (author.id) {
      return [author];
    } else {
      if (agentDetails?.version_details?.author) return [agentDetails?.version_details?.author];
      return [];
    }
  }
};

const AgentModal = memo(props => {
  const { open, onClose, agent } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [agentDetails, setAgentDetails] = useState(null);
  const cardAuthors = useMemo(() => getCardAuthors(agent, agentDetails), [agent, agentDetails]);
  const [getPublicApplicationDetail, { isFetching }] = useLazyPublicApplicationDetailsQuery();
  const styles = agentModalStyles();
  const [showContext, setShowContext] = useState(false);
  const [isSmallHeight, setIsSmallHeight] = useState(false);
  const name = useMemo(() => agent?.name || agentDetails?.name || 'Untitled Agent', [agent, agentDetails]);
  const description = useMemo(
    () => agent?.description || agentDetails?.description || 'No description available.',
    [agent, agentDetails],
  );
  const icon_meta = useMemo(
    () => agent?.icon_meta || agentDetails?.version_details?.icon_meta,
    [agent, agentDetails],
  );
  const link = useMemo(() => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename();
    return agent ? `${baseUrl}${basename}/agents-studio?${AgentsStudioConstants.AGENT_ID}=${agent.id}` : '';
  }, [agent]);

  const checkHeight = useCallback(() => {
    setIsSmallHeight(window.innerHeight <= 390);
  }, []);

  const getDetails = useCallback(async () => {
    if (agent) {
      const result = await getPublicApplicationDetail({
        projectId: PUBLIC_PROJECT_ID,
        applicationId: agent.id,
      });
      setAgentDetails(result?.data || null);
      setWelcomeMessage(result?.data?.version_details?.welcome_message || '');
    }
  }, [agent, getPublicApplicationDetail]);

  useEffect(() => {
    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => {
      window.removeEventListener('resize', checkHeight);
    };
  }, [checkHeight]);

  useEffect(() => {
    getDetails();
  }, [getDetails]);

  const onShowContext = () => {
    setShowContext(true);
  };

  const onStartConversation = useCallback(
    selectedAgentStarter => () => {
      dispatch(
        actions.setSelectedAgentInfo({
          agent: {
            participantType: ChatParticipantType.Applications,
            ...agent,
            ...agentDetails,
            project_id: PUBLIC_PROJECT_ID,
            entity_name: ChatParticipantType.Agents,
            entity_meta: { id: agent.id, project_id: PUBLIC_PROJECT_ID },
            entity_settings: {
              agent_type: agentDetails.version_details.agent_type,
              llm_settings: agentDetails.version_details.llm_settings,
              variables: agentDetails.version_details.variables,
              version_id: agentDetails.version_details.id,
            },
            meta: { name: agentDetails.name, mcp: agentDetails.meta?.mcp },
            // Store the original latest version ID for comparison later
            originalLatestVersionId: agentDetails.version_details?.id,
          },
          starter: selectedAgentStarter,
        }),
      );
      setTimeout(() => {
        const newRouteStack = [
          {
            breadCrumb: 'Chat',
            viewMode: ViewMode.Owner,
            pagePath: RouteDefinitions.Chat,
          },
        ];
        navigate(
          { pathname: RouteDefinitions.Chat, search: 'create=1' },
          {
            replace: false,
            state: { routeStack: newRouteStack },
          },
        );
      }, 0);
    },
    [dispatch, agent, agentDetails, navigate],
  );

  const onSelectStarter = useCallback(
    starter => {
      onStartConversation?.(starter)();
      onClose();
    },
    [onStartConversation, onClose],
  );

  const handleKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onStartConversation()();
      onClose();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onKeyDown={handleKeyDown}
        aria-labelledby="agent-modal-title"
        aria-describedby="agent-modal-description"
        sx={styles.dialog}
      >
        <Box sx={styles.mainPanel}>
          <DialogTitle sx={styles.dialogTitle}>
            <Box sx={styles.authorContainer}>
              <AuthorContainer
                authors={cardAuthors}
                showName={false}
                style={{
                  minWidth: '1.25rem',
                }}
              />
              <Typography
                variant="bodyMedium"
                color="text.secondary"
              >
                {cardAuthors[0]?.name || 'Author'}
              </Typography>
            </Box>
            <Box sx={styles.authorContainer}>
              <AgentStudioLike
                viewMode={ViewMode.Public}
                data={agent?.name ? agent : agentDetails || {}}
              />
              <CopyLinkToEntityButton link={link} />
              <IconButton
                variant="alita"
                color="secondary"
                aria-label="close"
                onClick={onClose}
                sx={{ padding: 0, margin: 0 }}
              >
                <CloseIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={styles.dialogContent(isSmallHeight)}>
              <Box sx={styles.iconContainer}>
                <EntityIcon
                  icon={icon_meta}
                  entityType={ChatParticipantType.Applications}
                  projectId={PUBLIC_PROJECT_ID}
                  editable={false}
                />
              </Box>
              <Typography
                variant="headingMedium"
                color="text.secondary"
              >
                {name}
              </Typography>
              <Typography
                variant="bodySmall2"
                sx={styles.description(isSmallHeight)}
              >
                {description}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={styles.showContext}
                onClick={onShowContext}
              >
                Show context
              </Typography>
              <Box sx={styles.sectionsContainer(isSmallHeight)}>
                <AgentConversationStarters
                  conversation_starters={agentDetails?.version_details?.conversation_starters || []}
                  onSelectStarter={onSelectStarter}
                />
                <AgentWelcomeMessage welcome_message={welcomeMessage} />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={styles.dialogActions}>
            <Button
              variant="alita"
              color="primary"
              onClick={onStartConversation()}
            >
              Start conversation
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      {showContext && (
        <ConfigurationModal.StyledShowContextModal
          context={agentDetails?.version_details?.instructions || ''}
          open={showContext}
          onClose={() => setShowContext(false)}
          contextLabel="Context"
          isLoading={isFetching}
        />
      )}
    </>
  );
});

AgentModal.displayName = 'AgentModal';

/** @type {MuiSx} */
const agentModalStyles = () => ({
  dialog: {
    '& .MuiDialog-paper': ({ palette }) => ({
      width: '37.5rem',
      maxWidth: '37.5rem',
      height: '41.875rem',
      borderRadius: '1rem',
      background: palette.background.agentModal.border,
      boxSizing: 'border-box',
      border: 'none !important',
      padding: '0.0625rem',
    }),
    '& .MuiDialogTitle-root': {
      margin: 0,
      width: '100%',
    },
    '& .MuiDialogContent-root': ({ palette }) => ({
      borderRadius: '1rem',
      background: palette.background.agentModal.border,
      margin: 0,
      width: '100%',
      border: 'none !important',
      padding: '0.0625rem 0 !important',
    }),
  },
  mainPanel: ({ palette }) => ({
    width: '100%',
    height: '100%',
    background: palette.background.agentModal.background,
    borderRadius: 'calc(1rem - 1px)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  }),
  dialogTitle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3.75rem',
  },
  authorContainer: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  dialogContent:
    isSmallHeight =>
    ({ palette }) => ({
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      borderRadius: '1rem',
      padding: '1.5rem 2rem 2rem 2rem',
      backgroundColor: palette.background.default,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      flex: 1,
      minHeight: 0,
      overflow: isSmallHeight ? 'auto' : 'hidden',
    }),
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '2.5rem',
    height: '2.5rem',
  },
  description:
    isSmallHeight =>
    ({ palette }) => ({
      textAlign: 'center',
      color: palette.text.metrics,
      ...(isSmallHeight
        ? {
            width: '100%',
            lineHeight: '1.25rem',
          }
        : {
            height: '2.5rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.25rem',
          }),
    }),
  dialogActions: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    padding: '.75rem 1.5rem !important',
    gap: '.75rem',
    height: '3.75rem',
  },
  showContext: ({ palette }) => ({
    cursor: 'pointer',
    color: palette.background.button.primary.hover,
    textAlign: 'center',
    '&:hover': {
      color: palette.text.button.showMore,
    },
  }),
  sectionsContainer: isSmallHeight => ({
    width: '100%',
    marginTop: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    flex: isSmallHeight ? 'none' : 1,
    minHeight: isSmallHeight ? 'auto' : 0,
    overflowY: isSmallHeight ? 'visible' : 'auto',
    overflowX: 'hidden',
  }),
});

export default AgentModal;
