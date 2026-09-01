import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { PUBLIC_PROJECT_ID } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import InfoIcon from '@/components/Icons/InfoIcon';
import { StyledTipsContainer } from '@/pages/Common/Components/InputVersionDialog';

import ParticipantActions from '../ParticipantActions/ParticipantActions';
import ParticipantWarning from './ParticipantWarning';

const ParticipantAttentionCard = memo(props => {
  const {
    participant,
    collapsed,
    isActive,
    isBeingEdited,
    isSkippedContainer,
    isPipelineParticipant,
    displayName,
    entityIcon,
    status,
    originalDetails,
    entity_meta,
    onClickHandler,
    onMouseEnter,
    onMouseLeave,
    onEdit,
    onDelete,
    disabledEdit,
    showEditButton,
    isHovering,
    isToolkitParticipant,
    type,
    handleEditClick,
    styles,
  } = props;

  const {
    isPublishedAgentGone,
    isVersionUnavailable,
    hasMisconfigurationErrors,
    shouldDisableThisItem,
    mcpIsDisconnected,
    someToolsAreUnavailable,
    blockedToolkitNames,
    remoteMcpLoggedOut,
    spOAuthLoggedOut,
    hasRemoteMcpLoggedIn,
    spConfig,
    openApiConfig,
    openApiOAuthLoggedOut,
  } = status;

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
    <StyledTipsContainer
      onClick={isActive || isVersionUnavailable ? onClickHandler : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={styles.attentionWrapper}
    >
      <Box sx={styles.attentionHeader}>
        <EntityIcon
          icon={entityIcon}
          entityType={isPipelineParticipant ? 'pipeline' : participant.entity_name}
          editable={false}
          sx={{ width: '1.5rem', height: '1.5rem', minWidth: '1.5rem' }}
          imageStyle={{ width: '1.5rem', height: '1.5rem' }}
          specifiedFontSize="0.875rem"
          isActive={isActive}
        />
        {!collapsed && (
          <Box sx={styles.attentionNameBox}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              sx={styles.attentionDisplayName}
            >
              {displayName}
            </Typography>
            {isBeingEdited && (
              <Typography
                variant="bodyMedium"
                color="primary.main"
                sx={styles.attentionEditingText}
              >
                {participant.entity_meta?.project_id != PUBLIC_PROJECT_ID ? 'Editing...' : 'Viewing...'}
              </Typography>
            )}
          </Box>
        )}
        {!collapsed && !isBeingEdited && (
          <ParticipantActions
            participant={participant}
            onEdit={onEdit}
            onDelete={onDelete}
            disabledEdit={disabledEdit || isPublishedAgentGone || isVersionUnavailable}
            disabledDeleteButton={disabledEdit}
            showButtons={isHovering}
            showEditButton={showEditButton}
            hasRemoteMcpLoggedIn={hasRemoteMcpLoggedIn}
            serverUrl={originalDetails?.settings?.url}
          />
        )}
      </Box>
      <Box
        sx={styles.attentionMessageRow}
        data-testid="chat-participant-warning-icon"
      >
        <Box sx={styles.attentionIcon}>
          <AttentionIcon />
        </Box>
        <Typography
          variant="bodySmall"
          color="text.attention"
          sx={styles.attentionMessage}
        >
          <ParticipantWarning
            isPublishedAgentGone={isPublishedAgentGone}
            isVersionUnavailable={isVersionUnavailable}
            hasMisconfigurationErrors={hasMisconfigurationErrors}
            shouldDisableThisItem={shouldDisableThisItem}
            mcpIsDisconnected={mcpIsDisconnected}
            someToolsAreUnavailable={someToolsAreUnavailable}
            blockedToolkitNames={blockedToolkitNames}
            remoteMcpLoggedOut={remoteMcpLoggedOut}
            spOAuthLoggedOut={spOAuthLoggedOut}
            participant={participant}
            handleEditClick={handleEditClick}
            isToolkitParticipant={isToolkitParticipant}
            type={type}
            originalDetails={originalDetails}
            entityMeta={entity_meta}
            spConfig={spConfig}
            openApiConfig={openApiConfig}
            openApiOAuthLoggedOut={openApiOAuthLoggedOut}
          />
        </Typography>
      </Box>
      {containerInfoRow}
    </StyledTipsContainer>
  );
});

ParticipantAttentionCard.displayName = 'ParticipantAttentionCard';

/** @type {MuiSx} */
export const participantAttentionCardStyles = ({ isActive, maxWidth }) => ({
  attentionWrapper: ({ palette }) => ({
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    padding: '.5rem 1rem',
    borderWidth: '.0625rem',
    borderStyle: 'solid',
    borderColor: palette.border.attention,
    borderRadius: '.5rem',
    backgroundColor: palette.background.attention,
    width: '100%',
    marginTop: '0rem',
    gap: '.5rem',
    cursor: isActive ? 'pointer' : 'default',
  }),
  attentionHeader: {
    display: 'flex',
    flexDirection: 'row',
    gap: '.75rem',
    height: '1.75rem',
    alignItems: 'center',
  },
  attentionNameBox: {
    flex: 1,
    maxWidth,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  attentionDisplayName: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  attentionEditingText: {
    maxWidth: '50%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpaceCollapse: 'preserve',
  },
  attentionMessageRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.9rem',
  },
  attentionIcon: ({ palette }) => ({
    paddingLeft: '0.25rem',
    width: '1rem',
    height: '1rem',
    '& svg': {
      fill: palette.icon.fill.attention,
    },
  }),
  attentionMessage: {
    wordBreak: 'break-word',
  },
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
});

export default ParticipantAttentionCard;
