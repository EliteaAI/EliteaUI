import { memo, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useToolkitsDetailsQuery } from '@/api/toolkits';
import NewParticipantList from '@/pages/NewChat/Recommendations/NewParticipantList';

import ToolList from './ToolList';
import ToolkitValidator from './ToolkitValidator';

const SlashSuggestionList = memo(props => {
  const {
    phase,
    toolkitQuery,
    toolQuery,
    selectedToolkit,
    isQueryFinal,
    onSelectToolkit,
    onSelectTool,
    onClose,
    participantToolkits,
    activeIndex,
    setActiveIndex,
    itemCountRef,
    onConfirmActiveRef,
  } = props;

  const toolkitValidationInfo = useSelector(state => state.chat.toolkitValidationInfo);

  // Only show toolkits that are added as conversation participants (AC1)
  // and are properly configured (AC2).
  // Name filtering is done client-side for instant response (no debounce lag).
  const filteredParticipants = useMemo(() => {
    if (!participantToolkits?.length) return [];
    return participantToolkits.filter(p => {
      const key = `${p.project_id}_${p.id}`;
      const validationInfo = toolkitValidationInfo?.[key];
      if (validationInfo?.length) return false;
      if (toolkitQuery && !p.name.toLowerCase().includes(toolkitQuery.toLowerCase())) return false;
      return true;
    });
  }, [participantToolkits, toolkitValidationInfo, toolkitQuery]);

  const { data: toolkitDetails, isFetching: isToolsFetching } = useToolkitsDetailsQuery(
    { projectId: selectedToolkit?.project_id, toolkitId: selectedToolkit?.id },
    { skip: phase !== 'tool' || !selectedToolkit },
  );

  const availableTools = useMemo(() => {
    if (!toolkitDetails?.settings) return [];
    const isMcp = toolkitDetails.type === 'mcp' || toolkitDetails.type?.startsWith('mcp_');
    if (isMcp) {
      return (toolkitDetails.settings.available_mcp_tools || []).map(item => ({
        name: item.value || item.label,
        description: item.description || '',
      }));
    }
    return (toolkitDetails.settings.selected_tools || []).map(name => ({ name, description: '' }));
  }, [toolkitDetails]);

  const filteredTools = useMemo(
    () =>
      availableTools.filter(tool => !toolQuery || tool.name.toLowerCase().includes(toolQuery.toLowerCase())),
    [availableTools, toolQuery],
  );

  useEffect(() => {
    if (phase !== 'toolkit' || !isQueryFinal) return;

    const match = filteredParticipants.find(p => p.name.toLowerCase().startsWith(toolkitQuery.toLowerCase()));
    if (match && (match.project_id !== selectedToolkit?.project_id || match.id !== selectedToolkit?.id)) {
      onSelectToolkit({
        id: match.id,
        project_id: match.project_id,
        name: match.name,
        type: match.type,
        settings: match.settings,
      });
    } else {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isQueryFinal, toolkitQuery, filteredParticipants]);

  // Keep itemCountRef in sync and reset active index whenever the visible list changes.
  const currentListLength = phase === 'toolkit' ? filteredParticipants.length : filteredTools.length;
  useEffect(() => {
    if (itemCountRef) itemCountRef.current = currentListLength;
    if (setActiveIndex) setActiveIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentListLength]);

  // Register the confirm callback for the current phase so Enter can trigger selection.
  useEffect(() => {
    if (!onConfirmActiveRef) return;
    if (phase === 'toolkit') {
      onConfirmActiveRef.current = idx => {
        const participant = filteredParticipants[idx];
        if (!participant) return;
        onSelectToolkit({
          id: participant.id,
          project_id: participant.project_id,
          name: participant.name,
          type: participant.type,
          settings: participant.settings,
        });
      };
    } else if (phase === 'tool') {
      onConfirmActiveRef.current = idx => {
        const tool = filteredTools[idx];
        if (!tool) return;
        onSelectTool(tool.name);
      };
    } else {
      onConfirmActiveRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, filteredParticipants, filteredTools]);

  // Render one validator per participant toolkit. Each mounts when the slash menu
  // opens and fires the validation API only when no data exists yet in Redux.
  const validators = participantToolkits?.map(({ id, project_id }) => (
    <ToolkitValidator
      key={`${project_id}_${id}`}
      toolkitId={id}
      projectId={project_id}
    />
  ));

  if (phase === 'idle') return null;

  if (phase === 'toolkit') {
    return (
      <>
        {validators}
        <NewParticipantList
          onSelectParticipant={participant =>
            onSelectToolkit({
              id: participant.id,
              project_id: participant.project_id,
              name: participant.name,
              type: participant.type,
              settings: participant.settings,
            })
          }
          isLoading={false}
          isFetching={false}
          participants={filteredParticipants}
          existingParticipantUids={[]}
          onClose={onClose}
          total={participantToolkits.length}
          title="Mention Toolkit or MCP"
          activeIndex={activeIndex}
        />
      </>
    );
  }

  // phase === 'tool' — hide the list entirely when the filter matches nothing (but not while loading)
  if (!isToolsFetching && toolQuery && filteredTools.length === 0) return null;

  return (
    <ToolList
      tools={filteredTools}
      toolkitName={selectedToolkit?.name}
      onSelectTool={onSelectTool}
      activeIndex={activeIndex}
      isLoading={isToolsFetching}
    />
  );
});

SlashSuggestionList.displayName = 'SlashSuggestionList';

export default SlashSuggestionList;
