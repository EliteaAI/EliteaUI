// Chat concept: the lists of the «+» menu. A copy of
// src/[fsd]/features/chat/lib/hooks/chat-button/useApplicationSubmenu.hooks.js; the lines marked «concept:» are the
// changes, the rest (queries, search per kind, paging, closing on a pick, toolkit and MCP switches) is the team's code.
// - concept: agents, pipelines and skills already in the chat stay in their list, marked `added` (today they are
//   hidden), so the list can show them on top under «In this chat · N» with a check;
// - concept: an added row is removed from the chat only by its delete icon (`onRemove`), never by a click on the row
//   (a removal by the whole row is easy to do by mistake); the menu stays open, as a toolkit's switch does; a click on
//   a row not yet added adds it and closes the menu, as today;
// - concept: the chat's agents, pipelines and skills are rows of their list even before their page has loaded (built
//   from the participants), so «In this chat · N» holds all of them;
// - concept: each kind also returns `inChat` (keys of its rows in the chat) and `total` (the API's count, which
//   .storybook/main.js › CONCEPT_PATCHES › concept-totals adds to the team's useDropdownData), for the section heads
//   «In this chat · N» / «All agents · N» and «Scroll for more · 20 of 116».
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDropdownData } from '@/[fsd]/features/chat/lib/hooks/chat-button/useDropdownData.hooks';
import {
  getChatParticipantUniqueId,
  getParticipantName,
} from '@/[fsd]/features/chat/participants/lib/helpers';
import { useSkillParticipants } from '@/[fsd]/features/skill/lib/hooks';
import { DropdownConstants } from '@/[fsd]/shared/lib/constants';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';

import { isMcpParticipant, isPipelineParticipant } from './conceptParticipant.helpers';

const SKILL_PAGE_SIZE = 20;
// the totals come from .storybook/main.js › concept-totals; if that patch did not apply, the lists show no totals
const NO_TOTALS = { agents: 0, pipelines: 0, toolkits: 0, mcps: 0 };

const SKILL_ICON_SX = {
  minWidth: '1.25rem !important',
  width: '1.25rem !important',
  height: '1.25rem !important',
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

// concept: a row for a participant whose page has not loaded yet, with the key the list gives it
// (name and icon where the team's add flow writes them: getParticipantName, entity_settings.icon_meta)
const toParticipantRow = (prefix, entityType) => p => {
  const name = getParticipantName(p) || p.meta?.name || p.name || '';
  return {
    key: `${prefix}-${p.entity_meta?.project_id}-${p.entity_meta?.id}`,
    label: name,
    data: { id: p.entity_meta?.id, project_id: p.entity_meta?.project_id, name },
    icon: createElement(EntityIcon, {
      sx: SKILL_ICON_SX,
      imageStyle: SKILL_IMAGE_STYLE,
      icon: p.entity_settings?.icon_meta || p.icon_meta || p.meta?.icon_meta,
      entityType,
      projectId: p.entity_meta?.project_id,
      editable: false,
      specifiedFontSize: DropdownConstants.DIMENSIONS.ICON_SVG_SIZE,
    }),
  };
};

// concept: the loaded rows, then the chat's rows of that kind not loaded yet
const withChatRows = (items, chatRows) => {
  const loaded = new Set(items.map(item => item.key));
  return [...items, ...chatRows.filter(row => !loaded.has(row.key))];
};

export const useConceptPlusSubmenu = props => {
  const { participants = [], onSelectParticipant, onDeleteParticipant, onClose, isOpen = false } = props;

  const hasBeenOpenedRef = useRef(false);
  const pendingTogglesRef = useRef(new Set());

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
    totals = NO_TOTALS,
  } = useDropdownData({
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
    () =>
      new Map(
        participants.map(p => [
          // a pipeline in any of its shapes (also a template's top-level agent_type) under the key its row uses
          getChatParticipantUniqueId(
            isPipelineParticipant(p) ? { ...p, entity_name: ChatParticipantType.Pipelines } : p,
          ),
          p,
        ]),
      ),
    [participants],
  );

  // concept: a click on a row not in the chat adds it, clears the kind's search and closes the menu (dev); a click on
  // an added row does nothing
  const handlePick = useCallback(
    (item, participantId, participantType, setSearch, extra = {}) =>
      () => {
        if (participantsById.has(participantId)) return;
        onSelectParticipant?.({ participantType, ...item.data, ...extra });
        setSearch('');
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

  // concept: a participant removed while the menu is open keeps its row, unchecked, until the menu closes
  const listedRef = useRef(new Map());
  const listedParticipants = useMemo(() => {
    if (!isOpen) listedRef.current = new Map();
    participants.forEach(p => listedRef.current.set(getChatParticipantUniqueId(p), p));
    return [...listedRef.current.values()];
  }, [participants, isOpen]);

  // concept: the chat's agents, pipelines and skills as rows, whether or not their page has loaded
  const chatRows = useMemo(
    () => ({
      agents: listedParticipants
        .filter(p => p.entity_name === ChatParticipantType.Applications && !isPipelineParticipant(p))
        .map(toParticipantRow('agent', 'application')),
      pipelines: listedParticipants
        .filter(isPipelineParticipant)
        .map(toParticipantRow('pipeline', 'pipeline')),
      skills: listedParticipants
        .filter(p => p.entity_name === ChatParticipantType.Skills)
        .map(toParticipantRow('skill', ChatParticipantType.Skills)),
    }),
    [listedParticipants],
  );

  const toolkitParticipantIds = useMemo(() => {
    const ids = new Set();
    participants.forEach(p => {
      if (p.entity_name === ChatParticipantType.Toolkits && !isMcpParticipant(p)) {
        const key = `${p.entity_meta?.id}_${p.entity_meta?.project_id || ''}`;
        ids.add(key);
      }
    });
    return ids;
  }, [participants]);

  const mcpParticipantIds = useMemo(() => {
    const ids = new Set();
    participants.forEach(p => {
      if (p.entity_name === ChatParticipantType.Toolkits && isMcpParticipant(p)) {
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

        if (isMCP !== isMcpParticipant(p)) return false;

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
      withChatRows(agentMenuItems, chatRows.agents)
        .filter(matchesSearch(agentSearch))
        .sort(byOwnThenName)
        .map(item => {
          const id = rowParticipantId(item, ChatParticipantType.Applications);
          return {
            ...item,
            added: participantsById.has(id),
            onClick: handlePick(item, id, ChatParticipantType.Applications, setAgentSearch),
            onRemove: handleRemove(id),
          };
        }),
    [agentMenuItems, chatRows.agents, agentSearch, participantsById, handlePick, handleRemove],
  );

  const pipelineItems = useMemo(
    () =>
      withChatRows(pipelineMenuItems, chatRows.pipelines)
        .filter(matchesSearch(pipelineSearch))
        .sort(byOwnThenName)
        .map(item => {
          const id = rowParticipantId(item, ChatParticipantType.Applications, 'pipeline');
          return {
            ...item,
            added: participantsById.has(id),
            onClick: handlePick(item, id, ChatParticipantType.Pipelines, setPipelineSearch, {
              agent_type: 'pipeline',
            }),
            onRemove: handleRemove(id),
          };
        }),
    [pipelineMenuItems, chatRows.pipelines, pipelineSearch, participantsById, handlePick, handleRemove],
  );

  // concept: skills keep the rows already in the chat, marked added (dev drops them)
  const skillItems = useMemo(
    () =>
      withChatRows([...ownSkills, ...catalogSkills].map(toSkillMenuItem), chatRows.skills)
        .filter(matchesSearch(skillSearch))
        .map(item => {
          const id = rowParticipantId(item, ChatParticipantType.Skills);
          return {
            ...item,
            added: participantsById.has(id),
            onClick: handlePick(item, id, ChatParticipantType.Skills, setSkillSearch),
            onRemove: handleRemove(id),
          };
        }),
    [ownSkills, catalogSkills, chatRows.skills, skillSearch, participantsById, handlePick, handleRemove],
  );

  const toolkitItems = useMemo(
    () =>
      toolkitMenuItems.map(item => {
        const key = `${item.data.id}_${item.data.project_id || ''}`;
        return {
          ...item,
          checked: toolkitParticipantIds.has(key),
          onToggle: () => handleToolkitToggle(item, false),
          pending: pendingToggles.has(key),
        };
      }),
    [toolkitMenuItems, toolkitParticipantIds, handleToolkitToggle, pendingToggles],
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
