// Chat concept, part 2 (stories 2.3–2.4): the lists of the «+» menu. A copy of
// src/[fsd]/features/chat/lib/hooks/chat-button/useApplicationSubmenu.hooks.js; the lines marked «concept:» are the
// changes, the rest (queries, search per kind, paging, closing on a pick, toolkit and MCP switches) is the team's code.
// Reference: tag chat-prototype-approved-2026-11-18, default view (approved.html › addBodyHTML, addRow, addPick).
// - concept: agents, pipelines and skills already in the chat stay in their list, marked `added` (dev hides them), so
//   the list can show them on top under «In this chat · N» with a check;
// - concept: an added row is removed from the chat only by its delete icon (`onRemove`), never by a click on the row
//   (owner 2026-11-24: a removal by the whole row is dangerous and not obvious); the menu stays open, as a toolkit's
//   switch does; a click on a row not yet added adds it and closes the menu, as on dev;
// - concept: each kind also returns `inChat` (keys of its rows in the chat) and `total` (the API's count), for the
//   section heads «In this chat · N» / «All agents · N» and «Scroll for more · 20 of 116».
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import { useSkillParticipants } from '@/[fsd]/features/skill/lib/hooks';
import { DropdownConstants } from '@/[fsd]/shared/lib/constants';
import { isMcpToolkit } from '@/[fsd]/shared/lib/helpers';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';

import { useConceptDropdownData } from './useConceptDropdownData';

const SKILL_PAGE_SIZE = 20;

const SKILL_ICON_SX = {
  minWidth: '1.25rem !important', // component-check: allow icon size copied from the team's hook
  width: '1.25rem !important', // component-check: allow icon size copied from the team's hook
  height: '1.25rem !important', // component-check: allow icon size copied from the team's hook
  '& > div': {
    width: '1.25rem',
    height: '1.25rem',
  },
  '& svg': {
    width: DropdownConstants.DIMENSIONS.ICON_SVG_SIZE,
    height: DropdownConstants.DIMENSIONS.ICON_SVG_SIZE,
    fontSize: DropdownConstants.DIMENSIONS.ICON_SVG_SIZE,
  },
};
const SKILL_IMAGE_STYLE = { width: '1.25rem', height: '1.25rem', borderRadius: '50%' };

const toSkillMenuItem = skill => ({
  key: `skill-${skill.project_id}-${skill.id}`,
  label: skill.name,
  description: skill.description,
  data: skill,
  icon: createElement(EntityIcon, {
    sx: SKILL_ICON_SX,
    imageStyle: SKILL_IMAGE_STYLE,
    icon: skill.icon_meta,
    entityType: ChatParticipantType.Skills,
    projectId: skill.project_id,
    editable: false,
    specifiedFontSize: DropdownConstants.DIMENSIONS.ICON_SVG_SIZE,
  }),
});

// concept: the participant id a list row would have in the chat (as useFilteredEntityItems builds it on dev)
const rowParticipantId = (item, entity_name, agent_type) =>
  getChatParticipantUniqueId({
    entity_name,
    entity_meta: { id: item.data?.id, project_id: item.data?.project_id },
    entity_settings: { agent_type },
  });

// dev order of agents and pipelines (useFilteredEntityItems): the project's own first, then Catalog, by name
const isPublicItem = item => item.data?.project_id == PUBLIC_PROJECT_ID;
const byOwnThenName = (a, b) =>
  isPublicItem(a) !== isPublicItem(b) ? (isPublicItem(a) ? 1 : -1) : a.label.localeCompare(b.label);
const matchesSearch = search => item =>
  !search || (item.label && item.label.toLowerCase().includes(search.toLowerCase()));

export const useConceptPlusSubmenu = props => {
  const { participants = [], onSelectParticipant, onDeleteParticipant, onClose, isOpen = false } = props;

  const hasBeenOpenedRef = useRef(false);
  const pendingTogglesRef = useRef(new Set());

  const isMcpVisible = useIsMcpVisible();

  if (isOpen) hasBeenOpenedRef.current = true;

  const [agentSearch, setAgentSearch] = useState('');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [toolkitSearch, setToolkitSearch] = useState('');
  const [mcpSearch, setMcpSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [pendingToggles, setPendingToggles] = useState(new Set());

  const {
    agentMenuItems,
    isAgentsLoading,
    pipelineMenuItems,
    isPipelinesLoading,
    toolkitMenuItems,
    isToolkitsLoading,
    mcpMenuItems,
    isMCPsLoading,
    onLoadMoreAgents,
    onLoadMorePipelines,
    onLoadMoreToolkits,
    onLoadMoreMCPs,
    totals,
  } = useConceptDropdownData({
    agentQuery: agentSearch,
    pipelineQuery: pipelineSearch,
    toolkitQuery: toolkitSearch,
    mcpQuery: mcpSearch,
    skip: !hasBeenOpenedRef.current,
  });

  const {
    ownSkills,
    catalogSkills,
    total: skillsTotal,
    isFetching: isSkillsLoading,
    onLoadMore: onLoadMoreSkills,
  } = useSkillParticipants({
    query: skillSearch,
    pageSize: SKILL_PAGE_SIZE,
    skip: !hasBeenOpenedRef.current,
  });

  // concept: the chat's participants by their id, to mark rows added and to remove them
  const participantsById = useMemo(
    () => new Map(participants.map(p => [getChatParticipantUniqueId(p), p])),
    [participants],
  );

  // concept: a click on a row not in the chat adds it and closes the menu (dev); a click on an added row does nothing
  const handlePick = useCallback(
    (item, participantId, participantType, extra = {}) =>
      () => {
        if (participantsById.has(participantId)) return;
        onSelectParticipant?.({ participantType, ...item.data, ...extra });
        onClose?.();
      },
    [participantsById, onSelectParticipant, onClose],
  );

  // concept: the delete icon of an added row removes it from the chat and keeps the menu open
  const handleRemove = useCallback(
    participantId => () => {
      const participant = participantsById.get(participantId);
      if (participant) onDeleteParticipant?.(participant);
    },
    [participantsById, onDeleteParticipant],
  );

  const toolkitParticipantIds = useMemo(() => {
    const ids = new Set();
    participants.forEach(p => {
      if (
        p.entity_name === ChatParticipantType.Toolkits &&
        !p.meta?.mcp &&
        p.entity_settings?.toolkit_type !== 'mcp'
      ) {
        const key = `${p.entity_meta?.id}_${p.entity_meta?.project_id || ''}`;
        ids.add(key);
      }
    });
    return ids;
  }, [participants]);

  const mcpParticipantIds = useMemo(() => {
    const ids = new Set();
    participants.forEach(p => {
      if (
        p.entity_name === ChatParticipantType.Toolkits &&
        (p.meta?.mcp || p.entity_settings?.toolkit_type === 'mcp')
      ) {
        const key = `${p.entity_meta?.id}_${p.entity_meta?.project_id || ''}`;
        ids.add(key);
      }
    });
    return ids;
  }, [participants]);

  const findParticipant = useCallback(
    (itemData, isMCP) => {
      return participants.find(p => {
        if (p.entity_name !== ChatParticipantType.Toolkits) return false;

        const isParticipantMCP = p.meta?.mcp || p.entity_settings?.toolkit_type === 'mcp';

        if (isMCP !== !!isParticipantMCP) return false;

        return (
          p.entity_meta?.id === itemData.id &&
          (p.entity_meta?.project_id || '') === (itemData.project_id || '')
        );
      });
    },
    [participants],
  );

  useEffect(() => {
    if (pendingTogglesRef.current.size > 0) {
      pendingTogglesRef.current = new Set();
      setPendingToggles(new Set());
    }
  }, [participants]);

  const handleToolkitToggle = useCallback(
    (item, isMCP) => {
      const key = `${item.data.id}_${item.data.project_id || ''}`;
      if (pendingTogglesRef.current.has(key)) return;

      pendingTogglesRef.current.add(key);
      setPendingToggles(new Set(pendingTogglesRef.current));

      const isChecked = isMCP ? mcpParticipantIds.has(key) : toolkitParticipantIds.has(key);

      if (isChecked) {
        const participant = findParticipant(item.data, isMCP);

        if (participant) onDeleteParticipant?.(participant);
      } else {
        onSelectParticipant?.({
          participantType: ChatParticipantType.Toolkits,
          ...item.data,
          meta: isMCP ? { mcp: true } : undefined,
        });
      }
    },
    [toolkitParticipantIds, mcpParticipantIds, findParticipant, onSelectParticipant, onDeleteParticipant],
  );

  // concept: agents and pipelines keep the rows already in the chat, marked added (dev: useFilteredEntityItems drops them)
  const agentItems = useMemo(
    () =>
      agentMenuItems
        .filter(matchesSearch(agentSearch))
        .sort(byOwnThenName)
        .map(item => {
          const id = rowParticipantId(item, ChatParticipantType.Applications);
          return {
            ...item,
            added: participantsById.has(id),
            onClick: handlePick(item, id, ChatParticipantType.Applications),
            onRemove: handleRemove(id),
          };
        }),
    [agentMenuItems, agentSearch, participantsById, handlePick, handleRemove],
  );

  const pipelineItems = useMemo(
    () =>
      pipelineMenuItems
        .filter(matchesSearch(pipelineSearch))
        .sort(byOwnThenName)
        .map(item => {
          const id = rowParticipantId(item, ChatParticipantType.Applications, 'pipeline');
          return {
            ...item,
            added: participantsById.has(id),
            onClick: handlePick(item, id, ChatParticipantType.Pipelines, { agent_type: 'pipeline' }),
            onRemove: handleRemove(id),
          };
        }),
    [pipelineMenuItems, pipelineSearch, participantsById, handlePick, handleRemove],
  );

  // concept: skills keep the rows already in the chat, marked added (dev drops them)
  const skillItems = useMemo(
    () =>
      [...ownSkills, ...catalogSkills].map(toSkillMenuItem).map(item => {
        const id = rowParticipantId(item, ChatParticipantType.Skills);
        return {
          ...item,
          added: participantsById.has(id),
          onClick: handlePick(item, id, ChatParticipantType.Skills),
          onRemove: handleRemove(id),
        };
      }),
    [ownSkills, catalogSkills, participantsById, handlePick, handleRemove],
  );

  const toolkitItems = useMemo(
    () =>
      toolkitMenuItems
        .map(item => {
          const key = `${item.data.id}_${item.data.project_id || ''}`;
          return {
            ...item,
            checked: toolkitParticipantIds.has(key),
            onToggle: () => handleToolkitToggle(item, false),
            pending: pendingToggles.has(key),
          };
        })
        .filter(({ tool }) => isMcpVisible || !isMcpToolkit(tool)),
    [toolkitMenuItems, toolkitParticipantIds, handleToolkitToggle, isMcpVisible, pendingToggles],
  );

  const mcpItems = useMemo(
    () =>
      mcpMenuItems.map(item => {
        const key = `${item.data.id}_${item.data.project_id || ''}`;
        return {
          ...item,
          checked: mcpParticipantIds.has(key),
          onToggle: () => handleToolkitToggle(item, true),
          pending: pendingToggles.has(key),
        };
      }),
    [mcpMenuItems, mcpParticipantIds, handleToolkitToggle, pendingToggles],
  );

  // concept: keys of each list's rows that are in the chat — added agents, pipelines, skills; toolkits and MCPs on
  const inChat = useMemo(
    () => ({
      agents: agentItems.filter(i => i.added).map(i => i.key),
      pipelines: pipelineItems.filter(i => i.added).map(i => i.key),
      skills: skillItems.filter(i => i.added).map(i => i.key),
      toolkits: toolkitItems.filter(i => i.checked).map(i => i.key),
      mcps: mcpItems.filter(i => i.checked).map(i => i.key),
    }),
    [agentItems, pipelineItems, skillItems, toolkitItems, mcpItems],
  );

  const resetAgentSearch = useCallback(() => setAgentSearch(''), []);
  const resetPipelineSearch = useCallback(() => setPipelineSearch(''), []);
  const resetToolkitSearch = useCallback(() => setToolkitSearch(''), []);
  const resetMcpSearch = useCallback(() => setMcpSearch(''), []);
  const resetSkillSearch = useCallback(() => setSkillSearch(''), []);

  return {
    agents: {
      items: agentItems,
      inChat: inChat.agents,
      total: totals.agents,
      isLoading: isAgentsLoading,
      searchValue: agentSearch,
      onSearchChange: e => setAgentSearch(e.target.value),
      onScroll: onLoadMoreAgents,
      resetSearch: resetAgentSearch,
    },
    pipelines: {
      items: pipelineItems,
      inChat: inChat.pipelines,
      total: totals.pipelines,
      isLoading: isPipelinesLoading,
      searchValue: pipelineSearch,
      onSearchChange: e => setPipelineSearch(e.target.value),
      onScroll: onLoadMorePipelines,
      resetSearch: resetPipelineSearch,
    },
    toolkits: {
      items: toolkitItems,
      inChat: inChat.toolkits,
      total: totals.toolkits,
      isLoading: isToolkitsLoading,
      searchValue: toolkitSearch,
      onSearchChange: e => setToolkitSearch(e.target.value),
      onScroll: onLoadMoreToolkits,
      resetSearch: resetToolkitSearch,
    },
    skills: {
      items: skillItems,
      inChat: inChat.skills,
      total: skillsTotal,
      isLoading: isSkillsLoading,
      searchValue: skillSearch,
      onSearchChange: e => setSkillSearch(e.target.value),
      onScroll: onLoadMoreSkills,
      resetSearch: resetSkillSearch,
    },
    mcps: {
      items: mcpItems,
      inChat: inChat.mcps,
      total: totals.mcps,
      isLoading: isMCPsLoading,
      searchValue: mcpSearch,
      onSearchChange: e => setMcpSearch(e.target.value),
      onScroll: onLoadMoreMCPs,
      resetSearch: resetMcpSearch,
    },
  };
};
