import { memo, useCallback, useMemo, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ChatMessageList } from '@/[fsd]/features/chat';
import { DrawerPageHeader } from '@/[fsd]/features/settings';
import { SkillRunHistoryFilters } from '@/[fsd]/features/skill';
import { SKILL_RUN_SEARCH_PARAMS } from '@/[fsd]/features/skill/lib/constants';
import {
  buildSkillRunHistoryColumns,
  buildSkillRunHistoryParams,
  hasSkillRunHistoryFilters,
} from '@/[fsd]/features/skill/lib/helpers';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useSkillHistoryEntity } from '@/[fsd]/widgets/skill-run-history/lib/hooks';
import { SearchParams, SkillsTabs } from '@/common/constants';
import useDebounceValue from '@/hooks/useDebounceValue';
import RouteDefinitions from '@/routes';

import SkillRunHistoryEmptyState from './SkillRunHistoryEmptyState';

const { ParticipantEntityTypes } = ParticipantEntityConstants;
const SEARCH_DEBOUNCE_MS = 400;
const LIST_WIDTH = '60rem';
const NO_FILTERS = {
  query: '',
  dateFrom: null,
  dateTo: null,
  authorId: null,
  model: null,
  status: null,
  versionId: null,
};

const SkillRunHistoryView = memo(props => {
  const { isCatalogSkill = false } = props;
  const { tab = SkillsTabs[0] } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const styles = skillRunHistoryViewStyles();

  const { skillId, skill, versions, entityProjectId } = useSkillHistoryEntity({ isCatalogSkill });
  const [filters, setFilters] = useState(NO_FILTERS);
  const [facets, setFacets] = useState(null);
  const debouncedQuery = useDebounceValue(filters.query, SEARCH_DEBOUNCE_MS);

  const appliedFilters = useMemo(() => ({ ...filters, query: debouncedQuery }), [debouncedQuery, filters]);
  const requestFilters = useMemo(() => buildSkillRunHistoryParams(appliedFilters), [appliedFilters]);
  const extraColumns = useMemo(() => buildSkillRunHistoryColumns(), []);

  const onFiltersChange = useCallback(change => setFilters(previous => ({ ...previous, ...change })), []);
  const onClearFilters = useCallback(() => setFilters(NO_FILTERS), []);

  const openInChat = useCallback(
    conversationId => navigate(`${RouteDefinitions.Chat}/${conversationId}`),
    [navigate],
  );

  const restoreIntoRunPanel = useCallback(
    conversationId => {
      const returnParams = new URLSearchParams(search);
      returnParams.delete(SKILL_RUN_SEARCH_PARAMS.run);
      returnParams.delete(SearchParams.HistoryRunId);
      const query = returnParams.toString();
      navigate(
        `${NavigationHelpers.buildRoute(RouteDefinitions.SkillsDetail, { tab, skillId })}${query ? `?${query}` : ''}`,
        { state: { restoredConversationID: conversationId } },
      );
    },
    [navigate, search, skillId, tab],
  );

  const handleRestoreConversation = useCallback(
    (conversationId, run) => {
      if (isCatalogSkill || run?.source !== ParticipantEntityTypes.Skill) openInChat(conversationId);
      else restoreIntoRunPanel(conversationId);
    },
    [isCatalogSkill, openInChat, restoreIntoRunPanel],
  );

  const handleOpenAnalytics = useCallback(
    conversationId => {
      const params = new URLSearchParams(search);
      params.set(SearchParams.HistoryRunId, String(conversationId));
      const analyticsRoute = isCatalogSkill
        ? NavigationHelpers.buildRoute(RouteDefinitions.CatalogSkillRunAnalytics, { skillId })
        : NavigationHelpers.buildRoute(RouteDefinitions.SkillsRunAnalytics, { tab, skillId });
      navigate(`${analyticsRoute}?${params.toString()}`);
    },
    [isCatalogSkill, navigate, search, skillId, tab],
  );

  const renderEmptyState = useCallback(
    page => (
      <SkillRunHistoryEmptyState
        isFiltered={hasSkillRunHistoryFilters(appliedFilters)}
        isCatalogSkill={isCatalogSkill}
        isModelFilterUnavailable={Boolean(page?.modelFilterUnavailable)}
      />
    ),
    [appliedFilters, isCatalogSkill],
  );

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs entityName={skill?.name} />}
      />
      <Box sx={styles.content}>
        <SkillRunHistoryFilters
          filters={filters}
          onChange={onFiltersChange}
          onClear={onClearFilters}
          facets={facets}
          versions={versions}
        />
        <RunHistoryContainer
          entityId={skillId}
          entityProjectId={entityProjectId}
          source={ParticipantEntityTypes.Skill}
          versions={versions}
          filters={requestFilters}
          onFacets={setFacets}
          extraColumns={extraColumns}
          listWidth={LIST_WIDTH}
          emptyState={renderEmptyState}
          handleRestoreConversation={handleRestoreConversation}
          handleOpenAnalytics={handleOpenAnalytics}
          ChatMessageListComponent={ChatMessageList}
          shareOpensHistoryTab
          fitParent
        />
      </Box>
    </Box>
  );
});

SkillRunHistoryView.displayName = 'SkillRunHistoryView';

/** @type {MuiSx} */
const skillRunHistoryViewStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '1rem 1.5rem',
    gap: '1rem',
    overflow: 'hidden',
  },
});

export default SkillRunHistoryView;
