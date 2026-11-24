// Piece 3 of the chat concept: the actions of a row in the «who answers» list. A copy of
// src/[fsd]/features/chat/participants/ui/participant-actions/ParticipantActions.jsx; the lines marked «concept:» are
// the changes. Reference: approved.html › agentRowHTML (`.acts`, `.fix`).
// - concept: ⚙ between Edit and Remove on an agent, a pipeline or a skill — «Settings in this chat: version,
//   variables» («…: version» on a skill); it opens their list next to the row (dev: the version and Variables sit in
//   the panel over the field, and only for the one who answers);
// - concept: «Fix» on a misconfigured agent, pipeline or toolkit, always in view (dev: the link «Check the <kind>» in
//   the warning line); it does what the pencil does — opens the editor (dev-check PA-083, owner 2026-11-16);
// - concept: «Log in» on a remote MCP server, a SharePoint or an OpenAPI toolkit the user is logged out of, in the
//   same place and look as «Fix» (dev: the link «Log in.» in the warning line); it starts the same sign-in as dev's link
//   (ConceptRowLogIn; owner 2026-11-24: every row with a problem has its action in one place, on the right);
// - Edit, ⚙ and Remove show under the pointer, as on dev.
// - concept: an item the user may only view (a Catalog agent or pipeline without the right to edit the Catalog) has
//   an eye «View agent» in the pencil's place; dev puts a ⚙ «View settings» there, which stood next to this list's own
//   ⚙ as two equal gears (owner 2026-11-24).
import { memo } from 'react';

import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { ParticipantEditPermissionMap } from '@/[fsd]/features/chat/participants/lib/constants/participant.constants';
import { useParticipantDetailsContext } from '@/[fsd]/features/chat/participants/lib/context/ParticipantDetailsContext';
import { stopPropagation } from '@/[fsd]/features/chat/participants/lib/helpers';
import DeleteParticipantButton from '@/[fsd]/features/chat/participants/ui/participant-actions/DeleteParticipantButton';
import EditParticipantButton from '@/[fsd]/features/chat/participants/ui/participant-actions/EditParticipantButton';
import { McpLogoutButton } from '@/[fsd]/features/mcp';
import { usePublicProjectAccessCheck } from '@/[fsd]/features/project';
import { Button } from '@/[fsd]/shared/ui';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import OpenEyeIcon from '@/components/Icons/OpenEyeIcon';
import SettingIcon from '@/components/Icons/SettingIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import ConceptRowLogIn, { logInOnRow } from './ConceptRowLogIn';
import { useWhoAnswers } from './whoAnswersContext';

const getEditLabel = participant => {
  if (participant.entity_settings?.agent_type === 'pipeline') return 'Edit pipeline';
  if (participant.entity_name === ChatParticipantType.Applications) return 'Edit agent';
  if (participant.meta?.mcp || participant?.entity_settings?.toolkit_type === 'mcp') return 'Edit mcp';
  if (participant.entity_name === ChatParticipantType.Skills) return 'Edit skill';
  return 'Edit toolkit';
};

// concept: who has settings in this chat — the kinds that answer
const hasChatSettings = participant =>
  participant.entity_name === ChatParticipantType.Applications ||
  participant.entity_name === ChatParticipantType.Pipelines ||
  participant.entity_name === ChatParticipantType.Skills;

const ConceptParticipantActions = memo(props => {
  const {
    participant,
    onEdit,
    onDelete,
    disabledEdit,
    disabledDeleteButton = false,
    showButtons = false,
    showEditButton = false,
    hasRemoteMcpLoggedIn,
    serverUrl,
  } = props;
  const styles = conceptParticipantActionsStyles();

  const isPublic = Number(participant.entity_meta?.project_id) === PUBLIC_PROJECT_ID;
  // concept: the same rule as dev's EditParticipantButton › canEdit, to pick the eye for an item the user only views
  const hasPublicProjectAccess = usePublicProjectAccessCheck();
  const { checkPermission } = useCheckPermission();
  const canEdit =
    (!isPublic && checkPermission(ParticipantEditPermissionMap[participant.entity_name])) ||
    (isPublic && hasPublicProjectAccess);

  // concept: the row's status says whether it needs «Fix» (the same status the warning line reads)
  const { getParticipantStatus, getDetails } = useParticipantDetailsContext();
  const status = getParticipantStatus(
    participant.entity_name,
    participant.entity_meta?.id,
    participant.entity_meta?.project_id,
  );
  const needsFix = status.hasMisconfigurationErrors && !status.governedRefusal;
  const logInKind = logInOnRow(status);
  const { onOpenSettings } = useWhoAnswers();
  const isSkill = participant.entity_name === ChatParticipantType.Skills;

  return (
    <Box
      onClick={stopPropagation}
      sx={styles.root}
    >
      <Box sx={styles.hoverOnly(showButtons)}>
        {hasRemoteMcpLoggedIn && <McpLogoutButton serverUrl={serverUrl} />}
        {showEditButton &&
          (canEdit ? (
            <EditParticipantButton
              id="EditButton"
              testId="chat-participant-edit-view-button"
              sx={styles.iconButton}
              participant={participant}
              onEdit={onEdit}
              tooltip={getEditLabel(participant)}
              disabled={disabledEdit}
              isPublic={isPublic}
            />
          ) : (
            // concept: an eye, not dev's ⚙, for an item the user only views
            <Tooltip
              title={getEditLabel(participant).replace(/^Edit/, 'View')}
              placement="top"
            >
              <IconButton
                id="EditButton"
                variant="elitea"
                color="tertiary"
                onClick={() => onEdit?.(participant)}
                disabled={disabledEdit}
                data-testid="chat-participant-edit-view-button"
                aria-label={getEditLabel(participant).replace(/^Edit/, 'View')}
                sx={styles.iconButton}
              >
                <OpenEyeIcon sx={styles.icon} />
              </IconButton>
            </Tooltip>
          ))}
        {/* concept: ⚙ — this participant's settings in this chat */}
        {hasChatSettings(participant) && (
          <Tooltip
            title={isSkill ? 'Settings in this chat: version' : 'Settings in this chat: version, variables'}
            placement="top"
          >
            <IconButton
              variant="elitea"
              color="tertiary"
              disabled={disabledEdit}
              onClick={event => onOpenSettings?.(participant, event.currentTarget)}
              data-testid="who-answers-participant-settings"
              aria-label="Settings in this chat"
              sx={styles.iconButton}
            >
              <SettingIcon sx={styles.icon} />
            </IconButton>
          </Tooltip>
        )}
        <DeleteParticipantButton
          id="DeleteButton"
          sx={styles.iconButton}
          participant={participant}
          disabled={disabledDeleteButton}
          onDelete={onDelete}
        />
      </Box>
      {/* concept: «Fix» opens the editor, as the pencil does */}
      {needsFix && (
        <Button.BaseBtn
          variant="elitea"
          color="secondary"
          onClick={() => onEdit?.(participant)}
          disabled={disabledEdit}
          data-testid="who-answers-fix"
        >
          Fix
        </Button.BaseBtn>
      )}
      {/* concept: «Log in» starts the same sign-in as dev's link in the warning line */}
      {logInKind && (
        <ConceptRowLogIn
          kind={logInKind}
          participant={participant}
          status={status}
          details={getDetails(
            participant.entity_name,
            participant.entity_meta?.id,
            participant.entity_meta?.project_id,
          )}
          disabled={disabledEdit}
        />
      )}
    </Box>
  );
});

ConceptParticipantActions.displayName = 'ConceptParticipantActions';

/** @type {MuiSx} */
const conceptParticipantActionsStyles = () => ({
  root: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
    flexShrink: 0,
  },
  hoverOnly: showButtons => ({
    display: showButtons ? 'flex' : 'none',
    gap: '0.25rem',
    alignItems: 'center',
  }),
  iconButton: {
    width: '1.75rem',
    height: '1.75rem',
  },
  icon: {
    fontSize: '1rem',
  },
});

export default ConceptParticipantActions;
