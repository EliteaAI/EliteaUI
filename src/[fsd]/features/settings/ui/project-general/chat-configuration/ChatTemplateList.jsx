import { memo, useCallback, useMemo } from 'react';

import { Box, Tooltip, Typography, useTheme } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import { ChatParticipantType } from '@/common/constants';
import { getToolIconByType } from '@/common/toolkitUtils';
import { EntityTypeIcon } from '@/components/EntityIcon';

const MAX_TEMPLATES = 5;

const PARTICIPANT_TYPE_ORDER = [
  ChatParticipantType.Applications,
  ChatParticipantType.Pipelines,
  ChatParticipantType.Toolkits,
  'mcp',
  ChatParticipantType.Users,
];

const getParticipantTypesPresent = participants => {
  const types = new Set(
    participants.map(p => {
      if (p.entity_name === ChatParticipantType.Applications) return ChatParticipantType.Applications;
      if (p.entity_name === ChatParticipantType.Pipelines || p.agent_type === 'pipeline')
        return ChatParticipantType.Pipelines;
      if (p.entity_name === 'mcp') return 'mcp';
      if (p.entity_name === ChatParticipantType.Toolkits) return ChatParticipantType.Toolkits;
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
  const { templates = [], selectedId, onSelect, onNewTemplate, isTeamProject } = props;

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
          <InfoTooltip infoTooltip="A chat template is a saved starting setup for new chats. You can create up to **5** and mark one as the **default**. Every new chat in this project starts from the default template, with its participants already added." />
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
        role="listbox"
        aria-label="Chat templates"
        sx={styles.list}
      >
        {visibleTemplates.map(t => {
          const isSelected = t.id === selectedId;
          const isDefault = t.is_default;
          const typesPresent = getParticipantTypesPresent(t.displayParticipants);
          const count = getParticipantCount(t.displayParticipants);

          return (
            <Box
              key={t.id}
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect?.(t.id)}
              sx={[styles.row, isSelected && styles.rowSelected]}
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
          );
        })}
      </Box>

      {isAtLimit ? (
        <Tooltip title="You can have up to 5 templates. Delete one to add another.">
          <Box sx={styles.limitBtnWrapper}>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              aria-disabled="true"
              disabled
              sx={styles.newBtn}
              fullWidth
            >
              Template limit reached ({MAX_TEMPLATES} of {MAX_TEMPLATES})
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      ) : (
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          onClick={handleNewTemplate}
          sx={styles.newBtn}
          fullWidth
        >
          + New template
        </Button.BaseBtn>
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
    padding: '0.625rem 0.75rem',
    borderRadius: '0.6255rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    cursor: 'pointer',
    backgroundColor: palette.background.default.secondary,
    '&:hover': {
      backgroundColor: palette.background.interactiveItem.hover,
    },
  }),
  rowSelected: ({ palette }) => ({
    border: `0.0625rem solid ${palette.primary.main}`,
    backgroundColor: palette.background.selectedItem.default,
  }),
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
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  defaultBadge: ({ palette }) => ({
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
  limitBtnWrapper: {
    display: 'block',
    width: '100%',
  },
  newBtn: ({ palette }) => ({
    border: `0.0625rem dashed ${palette.border.lines}`,
    '&:not(:disabled)': {
      borderStyle: 'dashed',
    },
  }),
});

export default ChatTemplateList;
