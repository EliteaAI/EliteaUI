import { useCallback, useMemo, useRef, useState } from 'react';

import { isMcpToolkit } from '@/[fsd]/shared/lib/helpers';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { ChatParticipantType } from '@/common/constants';
import useFilteredEntityItems from '@/hooks/chat/useFilteredEntityItems';
import { useDropdownData } from '@/hooks/useDropdownData';

export const useApplicationSubmenu = props => {
  const { participants = [], onSelectParticipant, onDeleteParticipant, onClose, isOpen = false } = props;

  const hasBeenOpenedRef = useRef(false);
  const isMcpVisible = useIsMcpVisible();

  if (isOpen) hasBeenOpenedRef.current = true;

  const [agentSearch, setAgentSearch] = useState('');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [toolkitSearch, setToolkitSearch] = useState('');
  const [mcpSearch, setMcpSearch] = useState('');

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

  const handleToolkitToggle = useCallback(
    (item, isMCP) => {
      const key = `${item.data.id}_${item.data.project_id || ''}`;
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

  const toolkitItems = useMemo(
    () =>
      toolkitMenuItems
        .map(item => {
          const key = `${item.data.id}_${item.data.project_id || ''}`;
          return {
            ...item,
            checked: toolkitParticipantIds.has(key),
            onToggle: () => handleToolkitToggle(item, false),
          };
        })
        .filter(({ tool }) => isMcpVisible || !isMcpToolkit(tool)),
    [toolkitMenuItems, toolkitParticipantIds, handleToolkitToggle, isMcpVisible],
  );

  const mcpItems = useMemo(
    () =>
      mcpMenuItems.map(item => {
        const key = `${item.data.id}_${item.data.project_id || ''}`;
        return {
          ...item,
          checked: mcpParticipantIds.has(key),
          onToggle: () => handleToolkitToggle(item, true),
        };
      }),
    [mcpMenuItems, mcpParticipantIds, handleToolkitToggle],
  );

  const resetAgentSearch = useCallback(() => setAgentSearch(''), []);
  const resetPipelineSearch = useCallback(() => setPipelineSearch(''), []);
  const resetToolkitSearch = useCallback(() => setToolkitSearch(''), []);
  const resetMcpSearch = useCallback(() => setMcpSearch(''), []);

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
