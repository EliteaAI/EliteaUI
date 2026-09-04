import { memo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import AttachIcon from '@/assets/attach-icon.svg?react';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

import ParticipantActions from '../ParticipantActions/ParticipantActions';
import ParticipantConnectionIcons from './ParticipantConnectionIcons';
import ParticipantWarning from './ParticipantWarning';

const ParticipantNormalCard = memo(props => {
  const {
    participant,
    collapsed,
    isActive,
    isAttachement,
    isBeingEdited,
    isSkippedContainer,
    isPipelineParticipant,
    displayName,
    versionName,
    entityIcon,
    nameTextRef,
    status,
    originalDetails,
    onClickHandler,
    onMouseEnter,
    onMouseLeave,
    onEdit,
    onDelete,
    disabledEdit,
    showEditButton,
    isHovering,
    styles,
  } = props;

  const { hasRemoteMcpLoggedIn, spConfig, spOAuthLoggedIn, openApiConfig, openAPIOAuthLoggedIn } = status;

  const containerInfoRow =
    !collapsed && isSkippedContainer ? (
      <Box sx={styles.infoMessageRow}>
        <Box sx={styles.infoIcon}>
          <InfoIcon />
        </Box>
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={styles.attentionMessage}
        >
          <ParticipantWarning isSkippedContainer />
        </Typography>
      </Box>
    ) : null;

  return (
    <Box sx={styles.normalItemWrapper}>
      <Box
        onClick={onClickHandler}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={styles.contentWrapper}
        data-testid={`chat-participant-row-${getChatParticipantUniqueId(participant)}`}
      >
        <EntityIcon
          icon={entityIcon}
          entityType={
            isPipelineParticipant
              ? 'pipeline'
              : participant.entity_name !== ChatParticipantType.Toolkits
                ? participant.entity_name
                : participant.meta?.mcp
                  ? 'mcp'
                  : participant.entity_name
          }
          editable={false}
          sx={{ width: '1.5rem', height: '1.5rem', minWidth: '1.5rem' }}
          imageStyle={{ width: '1.5rem', height: '1.5rem' }}
          specifiedFontSize="0.875rem"
          isActive={isActive}
          imgTestId="chat-participant-avatar"
          data-testid="chat-participant-icon"
        />
        {!collapsed && (
          <Box sx={styles.nameWrapper}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              ref={nameTextRef}
              sx={styles.nameContent}
            >
              {displayName}
              {isAttachement && (
                <IconButton
                  variant="elitea"
                  color="tertiary"
                  size="small"
                  disabled
                  sx={styles.attachmentButton}
                >
                  <AttachIcon style={styles.attachIcon} />
                </IconButton>
              )}
              <ParticipantConnectionIcons
                showMcp={!!originalDetails?.meta?.mcp}
                mcpOnline={originalDetails?.online}
                showSp={!!spConfig}
                spLoggedIn={spOAuthLoggedIn}
                showOpenApi={!!openApiConfig}
                openApiLoggedIn={openAPIOAuthLoggedIn}
              />
            </Typography>
            <Typography
              variant="bodyMedium"
              sx={styles.versionLabel}
            >
              {isBeingEdited
                ? participant.entity_meta?.project_id != PUBLIC_PROJECT_ID
                  ? 'Editing...'
                  : 'Viewing...'
                : versionName}
            </Typography>
          </Box>
        )}
        {!collapsed && !isBeingEdited && (
          <ParticipantActions
            participant={participant}
            onEdit={onEdit}
            onDelete={onDelete}
            disabledEdit={disabledEdit}
            disabledDeleteButton={disabledEdit}
            showButtons={isHovering}
            showEditButton={showEditButton}
            hasRemoteMcpLoggedIn={hasRemoteMcpLoggedIn}
            serverUrl={originalDetails?.settings?.url}
          />
        )}
      </Box>
      {containerInfoRow}
    </Box>
  );
});

ParticipantNormalCard.displayName = 'ParticipantNormalCard';

/** @type {MuiSx} */
export const participantNormalCardStyles = ({ collapsed, isActive, maxWidth, isBeingEdited }) => ({
  normalItemWrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  contentWrapper: ({ palette }) => ({
    cursor: 'pointer',
    padding: collapsed ? '0 0' : '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    gap: '0.5rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    width: '100%',
    height: '2.5rem',
    boxSizing: 'border-box',
    background: isActive ? palette.background.participant.active : palette.background.participant.default,
    border: isActive ? `0.0625rem solid ${palette.split.hover}` : undefined,
    ':hover': {
      background: palette.background.participant.hover,
    },
  }),
  nameWrapper: {
    flex: 1,
    maxWidth,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '.5rem',
  },
  nameContent: {
    flex: 1,
    minWidth: '50%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpaceCollapse: 'preserve',
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentButton: ({ palette }) => ({
    marginTop: '0.15rem',
    marginLeft: '0.35rem',
    minWidth: '1.25rem !important',
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '1.3125rem',
    padding: '0rem !important',
    border: `0.0625rem solid ${palette.border.lines}`,
    '&:disabled': {
      color: palette.text.metrics,
    },
  }),
  attachIcon: {
    width: '0.75rem',
    height: '0.75rem',
  },
  versionLabel: ({ palette }) => ({
    flexShrink: 0,
    maxWidth: isBeingEdited ? 'none' : '50%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpaceCollapse: 'preserve',
    color: isBeingEdited ? palette.primary.main : palette.text.primary,
  }),
  infoMessageRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '.375rem',
    padding: '0 .75rem .25rem',
  },
  infoIcon: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '1rem',
    height: '1rem',
    marginTop: '.0625rem',
    '& svg, & path': {
      fill: palette.icon.fill.secondary,
    },
  }),
  attentionMessage: {
    wordBreak: 'break-word',
  },
});

export default ParticipantNormalCard;
