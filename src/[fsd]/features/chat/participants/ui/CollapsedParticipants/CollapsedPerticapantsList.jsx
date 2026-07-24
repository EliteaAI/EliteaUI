import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, IconButton, SvgIcon } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useParticipantDetailsContext } from '@/[fsd]/features/chat/participants/lib/context/ParticipantDetailsContext';
import {
  getChatParticipantUniqueId,
  isSkippedContainerParticipant,
} from '@/[fsd]/features/chat/participants/lib/helpers';
import { isMcpToolkitType, isRemoteMcpToolkitType } from '@/[fsd]/shared/lib/helpers';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import AgentSvg from '@/assets/agent.svg?react';
import FlowSvg from '@/assets/flow-icon.svg?react';
import MCPSvg from '@/assets/mcp-icon.svg?react';
import ToolSvg from '@/assets/tool-icon.svg?react';
import { ChatParticipantType } from '@/common/constants';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import InfoIcon from '@/components/Icons/InfoIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import UsersParticipantDropdown from '../UsersParticipantDropdown';
import CollapsedParticipantsDropdown from './CollapsedParticipantsDropdown';

const wrapSvg = (SvgComponent, name) => {
  const Wrapped = props => (
    <SvgIcon
      component={SvgComponent}
      inheritViewBox
      {...props}
    />
  );
  Wrapped.displayName = name;
  return Wrapped;
};

const USERS_SECTION = { section: 'users', type: ChatParticipantType.Users, label: 'Users' };

const ENTITY_SECTIONS = [
  {
    section: 'agents',
    type: ChatParticipantType.Applications,
    icon: wrapSvg(AgentSvg, 'AgentIcon'),
    label: 'Agents',
  },
  {
    section: 'pipelines',
    type: ChatParticipantType.Pipelines,
    icon: wrapSvg(FlowSvg, 'FlowIcon'),
    label: 'Pipelines',
  },
  {
    section: 'toolkits',
    type: ChatParticipantType.Toolkits,
    icon: wrapSvg(ToolSvg, 'ToolIcon'),
    label: 'Toolkits',
  },
  { section: 'mcp', type: 'mcp', icon: wrapSvg(MCPSvg, 'MCPIcon'), label: 'MCPs' },
];

const CollapsedPerticapantsList = memo(props => {
  const {
    participants = [],
    onSelectParticipant,
    onDeleteParticipant,
    disabledAdd,
    disabledEdit,
    activeParticipantId,
    onUpdateParticipant,
    onEditParticipant,
    editingToolkit,
  } = props;

  const styles = collapsedPerticapantsListStyles();
  const { hasParticipantError } = useParticipantDetailsContext();

  const [collapsedTooltipType, setCollapsedTooltipType] = useState(null);
  const [openSectionType, setOpenSectionType] = useState(null);
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false);
  const sectionAnchorsRef = useRef({});

  const selectedProjectId = useSelectedProjectId();
  const isMcpVisible = useIsMcpVisible();
  const user = useSelector(state => state.user);
  const isPrivateProject = selectedProjectId == user.personal_project_id;
  const showUsersSection = !isPrivateProject;

  const groupedByType = useMemo(
    () =>
      participants.reduce((acc, p) => {
        let key = p.entity_name;
        if (
          p.entity_name === ChatParticipantType.Applications &&
          p.entity_settings?.agent_type === ChatParticipantType.Pipelines
        )
          key = ChatParticipantType.Pipelines;
        else if (
          p.entity_name === ChatParticipantType.Toolkits &&
          (isRemoteMcpToolkitType(p.entity_settings?.toolkit_type) || p.meta?.mcp === true)
        )
          key = 'mcp';

        if (!acc[key]) acc[key] = { count: 0, participants: [] };
        acc[key].count += 1;
        if (isMcpVisible || !isMcpToolkitType(p.entity_settings?.toolkit_type)) {
          acc[key].participants.push(p);
        }
        return acc;
      }, {}),
    [isMcpVisible, participants],
  );

  const usersGroup = groupedByType[USERS_SECTION.type];

  const onTriggerTooltipOpen = useCallback(
    type => {
      if (!openSectionType) setCollapsedTooltipType(type);
    },
    [openSectionType],
  );

  const onTriggerTooltipClose = useCallback(() => {
    setCollapsedTooltipType(null);
  }, []);

  const onCloseDropdown = useCallback(() => {
    setOpenSectionType(null);
  }, []);

  const onCollapsedTriggerClick = useCallback((type, event) => {
    setCollapsedTooltipType(null);
    sectionAnchorsRef.current[type] = event.currentTarget;
    setOpenSectionType(type);
  }, []);

  const onUsersMenuOpenChange = useCallback(open => {
    setIsUsersMenuOpen(open);
    if (open) setCollapsedTooltipType(null);
  }, []);

  return (
    <>
      {showUsersSection && usersGroup && (
        <StyledTooltip
          disableInteractive
          title={`${USERS_SECTION.label} in this conversation`}
          placement="right"
          open={collapsedTooltipType === USERS_SECTION.type && !isUsersMenuOpen}
          onOpen={() => onTriggerTooltipOpen(USERS_SECTION.type)}
          onClose={onTriggerTooltipClose}
        >
          <Box sx={styles.root}>
            <UsersParticipantDropdown
              showTrigger
              users={usersGroup.participants}
              onSelectUser={onSelectParticipant}
              onDeleteUser={onDeleteParticipant}
              disabledAdd={disabledAdd}
              currentUserId={user.id}
              placement="left-start"
              onOpenChange={onUsersMenuOpenChange}
              slotProps={{
                IconButton: {
                  variant: 'elitea',
                  color: 'secondary',
                  sx: styles.collapsedTriggerButton(usersGroup.count),
                },
                Icon: {
                  sx: styles.collapsedIcon,
                },
              }}
            />
          </Box>
        </StyledTooltip>
      )}

      {ENTITY_SECTIONS.map(entity => {
        const group = groupedByType[entity.type];

        if (!group || group.participants?.length === 0) return null;
        if (entity.type === 'mcp' && !isMcpVisible) return null;

        const sectionHasError = group.participants.some(p =>
          hasParticipantError(p.entity_name, p.entity_meta?.id, p.entity_meta?.project_id),
        );

        // Skipped-container hint (issue #5680): a non-pipeline container agent that is NOT the
        // active orchestrator won't be bound as a tool in adhoc chat. Show a neutral info dot in
        // the same indicator slot as the error icon. Real errors win the slot (more urgent), so
        // this only shows when the section has no error.
        const sectionHasSkippedContainer =
          !sectionHasError &&
          group.participants.some(
            p => getChatParticipantUniqueId(p) !== activeParticipantId && isSkippedContainerParticipant(p),
          );

        return (
          <StyledTooltip
            key={entity.section}
            title={
              sectionHasError
                ? `Misconfiguration error in ${entity?.label?.toLowerCase()}`
                : sectionHasSkippedContainer
                  ? 'Its sub-agent chain is at the nesting limit (3 tiers) — select it to run.'
                  : `${entity.label} in this conversation`
            }
            placement="right"
            disableInteractive
            disableHoverListener={false}
            disableFocusListener={false}
            disableTouchListener={false}
            open={collapsedTooltipType === entity.type && !openSectionType}
            onOpen={() => onTriggerTooltipOpen(entity.type)}
            onClose={onTriggerTooltipClose}
          >
            <Box
              sx={styles.root}
              data-testid={`chat-participants-badge-${entity.section}`}
            >
              <Box sx={styles.iconWithWarning}>
                <IconButton
                  variant="elitea"
                  color="secondary"
                  onClick={e => onCollapsedTriggerClick(entity.type, e)}
                  sx={styles.collapsedTriggerButton(group.count, sectionHasError, sectionHasSkippedContainer)}
                  data-testid="chat-participants-badge-button"
                >
                  <entity.icon sx={styles.collapsedIcon} />
                </IconButton>
                {sectionHasError ? (
                  <Box sx={styles.warningIcon}>
                    <AttentionIcon />
                  </Box>
                ) : sectionHasSkippedContainer ? (
                  <Box sx={styles.infoIcon}>
                    <InfoIcon />
                  </Box>
                ) : null}
              </Box>
              <CollapsedParticipantsDropdown
                preferLeft
                preferTopAlign
                anchorEl={sectionAnchorsRef.current[entity.type]}
                open={openSectionType === entity.type}
                onClose={onCloseDropdown}
                participants={group.participants}
                showDivider={false}
                disabledEdit={disabledEdit}
                onSelectParticipant={onSelectParticipant}
                activeParticipantId={activeParticipantId}
                onDeleteParticipant={onDeleteParticipant}
                onUpdateParticipant={onUpdateParticipant}
                onEditParticipant={onEditParticipant}
                entityType={entity.label}
                editingToolkit={editingToolkit}
              />
            </Box>
          </StyledTooltip>
        );
      })}
    </>
  );
});

CollapsedPerticapantsList.displayName = 'CollapsedPerticapantsList';

/**
 *
 * @type MuiSx
 */
const collapsedPerticapantsListStyles = () => ({
  root: {
    width: '2.5rem',

    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconWithWarning: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },

  collapsedTriggerButton:
    (count, hasError, hasInfo) =>
    ({ palette }) => ({
      padding: '.375rem',
      borderRadius: '8px',
      width: '2.25rem',
      height: '2.25rem',
      position: 'relative',
      marginRight: '0.25rem',

      '&::after': {
        content: `"${count}"`,
        position: 'absolute',
        top: '-9px',
        right: '-9px',
        minWidth: '1.25rem',
        height: '1.25rem',
        borderRadius: '50%',
        backgroundColor: palette.border.lines,
        color: palette.text.secondary,
        fontSize: '0.625rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        zIndex: 1,
      },

      '&&': {
        backgroundColor: `${palette.background.participant.default} !important`,
      },

      ...(hasError && {
        border: `0.0625rem solid ${palette.border.attention}`,
      }),

      ...(!hasError &&
        hasInfo && {
          border: `0.0625rem solid ${palette.border.lines}`,
        }),

      color: `${palette.secondary.main} !important`,

      '& .MuiSvgIcon-root path': {
        fill: `${palette.secondary.main} !important`,
      },
    }),

  warningIcon: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1rem',
    height: '1rem',
    '& svg': {
      fill: palette.icon.fill.attention,
      width: '1rem',
      height: '1rem',
    },
  }),

  infoIcon: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1rem',
    height: '1rem',
    '& svg, & svg path': {
      fill: palette.icon.fill.secondary,
      width: '1rem',
      height: '1rem',
    },
  }),

  collapsedIcon: {
    fontSize: '1.25rem !important',

    color: ({ palette }) => palette.secondary.main,
  },
});

export default CollapsedPerticapantsList;
