import { memo, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { ChatParticipantType, PAGE_SIZE } from '@/common/constants';
import useParticipants from '@/hooks/chat/useParticipants';
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
    participantToolkitIds,
  } = props;

  const toolkitValidationInfo = useSelector(state => state.chat.toolkitValidationInfo);

  const { participants, isLoading, isFetching, onLoadMore, total } = useParticipants({
    sortBy: 'name',
    sortOrder: 'asc',
    pageSize: PAGE_SIZE,
    query: toolkitQuery,
    types: [ChatParticipantType.Toolkits],
    projectFilter: 'all',
    forceSkip: phase !== 'toolkit',
  });

  // Only show toolkits that are added as conversation participants (AC1)
  // and are properly configured (AC2).
  // Name filtering is done client-side for instant response (no debounce lag).
  const filteredParticipants = useMemo(() => {
    if (!participantToolkitIds?.length) return [];
    const idKeys = new Set(participantToolkitIds.map(p => `${p.project_id}_${p.id}`));
    return participants.filter(p => {
      const key = `${p.project_id}_${p.id}`;
      if (!idKeys.has(key)) return false;
      const validationInfo = toolkitValidationInfo?.[key];
      if (validationInfo?.length) return false;
      if (toolkitQuery && !p.name.toLowerCase().includes(toolkitQuery.toLowerCase())) return false;
      return true;
    });
  }, [participants, participantToolkitIds, toolkitValidationInfo, toolkitQuery]);

  const availableTools = useMemo(() => {
    if (!selectedToolkit?.settings) return [];
    const isMcp = selectedToolkit.type === 'mcp' || selectedToolkit.type?.startsWith('mcp_');
    if (isMcp) {
      return (selectedToolkit.settings.available_mcp_tools || []).map(item => ({
        name: item.value || item.label,
        description: item.description || '',
      }));
    }
    return (selectedToolkit.settings.selected_tools || []).map(name => ({ name, description: '' }));
  }, [selectedToolkit]);

  const filteredTools = useMemo(
    () =>
      availableTools.filter(tool => !toolQuery || tool.name.toLowerCase().includes(toolQuery.toLowerCase())),
    [availableTools, toolQuery],
  );

  useEffect(() => {
    if (phase !== 'toolkit' || !isQueryFinal || isFetching) return;

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
  }, [phase, isQueryFinal, isFetching, toolkitQuery, filteredParticipants]);

  // Render one validator per participant toolkit. Each mounts when the slash menu
  // opens and fires the validation API only when no data exists yet in Redux.
  const validators = participantToolkitIds?.map(({ id, project_id }) => (
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
          isLoading={isLoading}
          isFetching={isFetching}
          participants={filteredParticipants}
          existingParticipantUids={[]}
          onClose={onClose}
          onLoadMore={onLoadMore}
          total={total}
          title="Mention toolkit"
        />
      </>
    );
  }

  // phase === 'tool' — hide the list entirely when the filter matches nothing
  if (toolQuery && filteredTools.length === 0) return null;

  return (
    <ToolList
      tools={filteredTools}
      toolkitName={selectedToolkit?.name}
      onSelectTool={onSelectTool}
    />
  );
});

SlashSuggestionList.displayName = 'SlashSuggestionList';

export default SlashSuggestionList;
