import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import { useSkillParticipants } from '@/[fsd]/features/skill/lib/hooks';
import { isMcpToolkit } from '@/[fsd]/shared/lib/helpers';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { ChatParticipantType } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import { DROPDOWN_CONSTANTS } from '@/components/UnifiedDropdown';
import useFilteredEntityItems from '@/hooks/chat/useFilteredEntityItems';
import { useDropdownData } from '@/hooks/useDropdownData';

const SKILL_PAGE_SIZE = 20;

const SKILL_ICON_SX = {
  minWidth: '1.25rem !important',
  width: '1.25rem !important',
  height: '1.25rem !important',
  '& > div': {
    width: '1.25rem',
    height: '1.25rem',
  },
  '& svg': {
    width: DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE,
    height: DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE,
    fontSize: DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE,
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
    specifiedFontSize: DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE,
  }),
});

export const useApplicationSubmenu = props => {
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
    isFetching: isSkillsLoading,
    onLoadMore: onLoadMoreSkills,
  } = useSkillParticipants({
    query: skillSearch,
    pageSize: SKILL_PAGE_SIZE,
    skip: !hasBeenOpenedRef.current,
  });

  const skillParticipantIds = useMemo(
    () =>
      new Set(
        participants
          .filter(p => p.entity_name === ChatParticipantType.Skills)
          .map(p => getChatParticipantUniqueId(p)),
      ),
    [participants],
  );

  const filteredAgents = useFilteredEntityItems(
    agentMenuItems,
    participants,
    ChatParticipantType.Applications,
    agentSearch,
  );

  const filteredPipelines = useFilteredEntityItems(
    pipelineMenuItems,
    participants,
    ChatParticipantType.Pipelines,
    pipelineSearch,
  );

  const handleAgentClick = useCallback(
    item => () => {
      onSelectParticipant?.({
        participantType: ChatParticipantType.Applications,
        ...item.data,
      });
      setAgentSearch('');
      onClose?.();
    },
    [onSelectParticipant, onClose],
  );

  const handlePipelineClick = useCallback(
    item => () => {
      onSelectParticipant?.({
        participantType: ChatParticipantType.Pipelines,
        ...item.data,
        agent_type: 'pipeline',
      });
      setPipelineSearch('');
      onClose?.();
    },
    [onSelectParticipant, onClose],
  );

  const handleSkillClick = useCallback(
    item => () => {
      onSelectParticipant?.({
        participantType: ChatParticipantType.Skills,
        ...item.data,
      });
      setSkillSearch('');
      onClose?.();
    },
    [onSelectParticipant, onClose],
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

  const agentItems = useMemo(
    () => filteredAgents.map(item => ({ ...item, onClick: handleAgentClick(item) })),
    [filteredAgents, handleAgentClick],
  );

  const pipelineItems = useMemo(
    () => filteredPipelines.map(item => ({ ...item, onClick: handlePipelineClick(item) })),
    [filteredPipelines, handlePipelineClick],
  );

  const skillItems = useMemo(
    () =>
      [...ownSkills, ...catalogSkills]
        .filter(
          skill =>
            !skillParticipantIds.has(
              getChatParticipantUniqueId({
                entity_name: ChatParticipantType.Skills,
                entity_meta: { id: skill.id, project_id: skill.project_id },
              }),
            ),
        )
        .map(toSkillMenuItem)
        .map(item => ({ ...item, onClick: handleSkillClick(item) })),
    [ownSkills, catalogSkills, skillParticipantIds, handleSkillClick],
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

  const resetAgentSearch = useCallback(() => setAgentSearch(''), []);
  const resetPipelineSearch = useCallback(() => setPipelineSearch(''), []);
  const resetToolkitSearch = useCallback(() => setToolkitSearch(''), []);
  const resetMcpSearch = useCallback(() => setMcpSearch(''), []);
  const resetSkillSearch = useCallback(() => setSkillSearch(''), []);

  return {
    agents: {
      items: agentItems,
      isLoading: isAgentsLoading,
      searchValue: agentSearch,
      onSearchChange: e => setAgentSearch(e.target.value),
      onScroll: onLoadMoreAgents,
      resetSearch: resetAgentSearch,
    },
    pipelines: {
      items: pipelineItems,
      isLoading: isPipelinesLoading,
      searchValue: pipelineSearch,
      onSearchChange: e => setPipelineSearch(e.target.value),
      onScroll: onLoadMorePipelines,
      resetSearch: resetPipelineSearch,
    },
    toolkits: {
      items: toolkitItems,
      isLoading: isToolkitsLoading,
      searchValue: toolkitSearch,
      onSearchChange: e => setToolkitSearch(e.target.value),
      onScroll: onLoadMoreToolkits,
      resetSearch: resetToolkitSearch,
    },
    skills: {
      items: skillItems,
      isLoading: isSkillsLoading,
      searchValue: skillSearch,
      onSearchChange: e => setSkillSearch(e.target.value),
      onScroll: onLoadMoreSkills,
      resetSearch: resetSkillSearch,
    },
    mcps: {
      items: mcpItems,
      isLoading: isMCPsLoading,
      searchValue: mcpSearch,
      onSearchChange: e => setMcpSearch(e.target.value),
      onScroll: onLoadMoreMCPs,
      resetSearch: resetMcpSearch,
    },
  };
};
