import { memo, useCallback, useMemo } from 'react';

import { Box, Tooltip, Typography, useTheme } from '@mui/material';

import { isMcpToolkitType } from '@/[fsd]/shared/lib/helpers';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import PlusIcon from '@/assets/plus-icon.svg?react';
import { ChatParticipantType } from '@/common/constants';
import { getToolIconByType } from '@/common/toolkitUtils';
import { EntityTypeIcon } from '@/components/EntityIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import OpenEyeIcon from '@/components/Icons/OpenEyeIcon';

const MAX_TEMPLATES = 5;
const LIMIT_REACHED_TOOLTIP = `You can have up to ${MAX_TEMPLATES} templates. Delete one to add another.`;

const PARTICIPANT_TYPE_ORDER = [
  ChatParticipantType.Applications,
  ChatParticipantType.Pipelines,
  ChatParticipantType.Toolkits,
  'mcp',
  ChatParticipantType.Skills,
  ChatParticipantType.Users,
];

const getParticipantTypesPresent = participants => {
  const types = new Set(
    participants.map(p => {
      if (p.entity_name === ChatParticipantType.Applications) return ChatParticipantType.Applications;
      if (p.entity_name === ChatParticipantType.Pipelines || p.agent_type === 'pipeline')
        return ChatParticipantType.Pipelines;
      if (p.entity_name === 'mcp') return 'mcp';
      if (p.entity_name === ChatParticipantType.Toolkits) {
        return isMcpToolkitType(p.toolkit_type) ? 'mcp' : ChatParticipantType.Toolkits;
      }
      if (p.entity_name === ChatParticipantType.Users) return ChatParticipantType.Users;
      return p.entity_name;
    }),
  );
  return PARTICIPANT_TYPE_ORDER.filter(t => types.has(t));
};

const getParticipantCount = participants => {
  const count = participants.length;
  if (count === 1) return '1 participant';
  return `${count} participants`;
};

const ChatTemplateList = memo(props => {
  const { templates = [], canEdit = true, onEdit, onDelete, onNewTemplate, isTeamProject } = props;

  const theme = useTheme();
  const isAtLimit = templates.length >= MAX_TEMPLATES;
  const styles = chatTemplateListStyles();

  const handleNewTemplate = useCallback(() => {
    if (isAtLimit) return;
    onNewTemplate?.();
  }, [isAtLimit, onNewTemplate]);

  const visibleTemplates = useMemo(() => {
    return templates.map(t => ({
      ...t,
      displayParticipants: isTeamProject
        ? (t.participants ?? [])
        : (t.participants ?? []).filter(p => p.entity_name !== ChatParticipantType.Users),
    }));
  }, [templates, isTeamProject]);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Box sx={styles.titleGroup}>
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Chat templates
          </Typography>
          <InfoTooltip infoTooltip="A chat template is a saved starting setup for new chats. You can create up to **5** and optionally mark one as the **default**. Every new chat in this project starts from the default template, with its participants already added." />
        </Box>
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {templates.length} of {MAX_TEMPLATES}
        </Typography>
      </Box>

      <Typography
        variant="bodySmall"
        color="text.secondary"
        sx={styles.helperText}
      >
        The default template is applied to every new chat in this project.
      </Typography>

      <Box
        role="list"
        aria-label="Chat templates"
        sx={styles.list}
      >
        {visibleTemplates.map(t => {
          const isDefault = t.is_default;
          const typesPresent = getParticipantTypesPresent(t.displayParticipants);
          const count = getParticipantCount(t.displayParticipants);

          return (
            <Box
              key={t.id}
              role="listitem"
              sx={styles.row}
              data-testid={`template-row-${t.id}`}
            >
              <Box sx={styles.rowMain}>
                <Box sx={styles.rowTop}>
                  <Typography
                    variant="labelSmall"
                    color="text.secondary"
                    sx={styles.rowName}
                  >
                    {t.name}
                  </Typography>
                  {isDefault && (
                    <Typography
                      component={Box}
                      variant="bodySmall"
                      color="text.secondary"
                      sx={styles.defaultBadge}
                    >
                      Default
                    </Typography>
                  )}
                </Box>
                <Box sx={styles.rowMeta}>
                  <Typography
                    variant="bodySmall"
                    color="text.primary"
                  >
                    {count}
                  </Typography>
                  {typesPresent.length > 0 && (
                    <Box sx={styles.typeIcons}>
                      {typesPresent.map(type => {
                        const isToolkitLike = type === ChatParticipantType.Toolkits || type === 'mcp';
                        return isToolkitLike ? (
                          <Box
                            key={type}
                            sx={styles.typeIcon}
                          >
                            {getToolIconByType('', theme, { isMCP: type === 'mcp' })}
                          </Box>
                        ) : (
                          <EntityTypeIcon
                            key={type}
                            type={type}
                            specifiedFontSize="0.75rem"
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Box>
              {(onEdit || onDelete) && (
                <Box
                  className="template-row-actions"
                  sx={styles.rowActions}
                >
                  {onEdit && (
                    // Without edit permission the same action opens the template read-only
                    <Button.BaseBtn
                      variant={BUTTON_VARIANTS.tertiary}
                      onClick={() => onEdit(t.id)}
                      startIcon={
                        canEdit ? (
                          <EditIcon fill={theme.palette.icon.default} />
                        ) : (
                          <OpenEyeIcon fill={theme.palette.icon.default} />
                        )
                      }
                      aria-label={`${canEdit ? 'Edit' : 'View'} ${t.name}`}
                      title={canEdit ? 'Edit template' : 'View template'}
                      data-testid={`template-edit-${t.id}`}
                    />
                  )}
                  {onDelete && (
                    <Button.BaseBtn
                      variant={BUTTON_VARIANTS.tertiary}
                      onClick={() => onDelete(t)}
                      startIcon={<DeleteIcon fill={theme.palette.icon.default} />}
                      aria-label={`Delete ${t.name}`}
                      title="Delete template"
                      data-testid={`template-delete-${t.id}`}
                    />
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {onNewTemplate && (
        // Disabled buttons do not fire pointer events, so the tooltip needs a wrapper to anchor to
        <Tooltip title={isAtLimit ? LIMIT_REACHED_TOOLTIP : ''}>
          <Box sx={styles.newBtnWrapper}>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.iconLabel}
              startIcon={<PlusIcon />}
              onClick={handleNewTemplate}
              disabled={isAtLimit}
              data-testid="chat-template-create-button"
            >
              Template
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
});

ChatTemplateList.displayName = 'ChatTemplateList';

/** @type {MuiSx} */
const chatTemplateListStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  helperText: {
    marginBottom: '0.25rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  row: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '3.75rem',
    padding: '0.75rem 1.5rem 0.75rem 1rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.surface.interactive.default,
    '&:hover': {
      backgroundColor: palette.background.surface.interactive.active,
    },
    // Actions appear on hover or keyboard focus. Hidden with opacity, not visibility, so the
    // buttons stay in the tab order and `:focus-within` can reveal them.
    '&:hover .template-row-actions, &:focus-within .template-row-actions': {
      opacity: 1,
    },
  }),
  rowActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    opacity: 0,
  },
  rowMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
  },
  rowTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  rowName: {
    minWidth: 0,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  defaultBadge: ({ palette }) => ({
    flexShrink: 0,
    height: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '1.25rem',
    padding: '0.125rem 0.5rem',
    backgroundColor: palette.components.chatTemplate.badge.background,
  }),
  rowMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  typeIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  typeIcon: {
    display: 'flex',
    alignItems: 'center',
    '& svg': { width: '0.75rem', height: '0.75rem' },
  },
  newBtnWrapper: {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    marginTop: '0.5rem',
  },
});

export default ChatTemplateList;
