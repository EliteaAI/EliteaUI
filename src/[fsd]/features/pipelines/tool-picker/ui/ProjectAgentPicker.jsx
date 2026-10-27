import { memo, useCallback, useContext, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Typography } from '@mui/material';

import { TOOL_REF_KINDS } from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';
import { buildApplicationPickerItems } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/pickerItems.helpers';
import {
  collectToolReferences,
  getReferencedNames,
  isApplicationTool,
} from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/pipelineToolUsage.helpers';
import { useCreateInNewTab } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/useCreateInNewTab.hooks';
import { useIsVersionLocked } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/useIsVersionLocked.hooks';
import { usePickerMenu } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/usePickerMenu.hooks';
import { useProjectApplicationsList } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/useProjectApplicationsList.hooks';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import RouteDefinitions from '@/routes';

import PickerEntityIcon from './PickerEntityIcon';
import PickerItemRow from './PickerItemRow';
import PickerMenu from './PickerMenu';
import PickerTrigger from './PickerTrigger';

const isPipelineSource = source =>
  source?.agent_type === 'pipeline' || source?.version_details?.agent_type === 'pipeline';

/**
 * Picks any agent or pipeline of the project for an Agent node.
 * @param {(item: object) => void} props.onSelect gets the picker item; `item.isAttached` tells whether
 *   `item.source` is an attached tool or a project list row
 */
const ProjectAgentPicker = memo(props => {
  const {
    label = 'Agents & Pipelines',
    value,
    onSelect,
    onClear,
    disabled = false,
    'data-testid': testId,
  } = props;

  const { yamlJsonObject } = useContext(FlowEditorContext);
  const isVersionLocked = useIsVersionLocked();
  const { values } = useFormikContext();
  const { anchorEl, isOpen, hasOpened, search, setSearch, query, openMenu, closeMenu } = usePickerMenu();
  const agents = useProjectApplicationsList({ agentsType: 'classic', query, skip: !hasOpened });
  const pipelines = useProjectApplicationsList({ agentsType: 'pipeline', query, skip: !hasOpened });

  const reload = useCallback(() => {
    agents.reload();
    pipelines.reload();
  }, [agents, pipelines]);
  const openCreatePage = useCreateInNewTab(reload);

  const attachedTools = useMemo(
    () => (values?.version_details?.tools || []).filter(isApplicationTool),
    [values?.version_details?.tools],
  );
  const usedNames = useMemo(
    () => getReferencedNames(collectToolReferences(yamlJsonObject), TOOL_REF_KINDS.application),
    [yamlJsonObject],
  );

  const buildItems = useCallback(
    (rows, pipelineGroup) =>
      buildApplicationPickerItems({
        rows,
        attachedTools: attachedTools.filter(tool => isPipelineSource(tool) === pipelineGroup),
        allAttachedTools: attachedTools,
        usedNames,
        query: search,
        excludeId: values?.id,
      }).map(item => ({ ...item, isPipeline: pipelineGroup })),
    [attachedTools, search, usedNames, values?.id],
  );

  const groups = useMemo(
    () => [
      { key: 'agents', title: 'Agents', items: buildItems(agents.rows, false) },
      { key: 'pipelines', title: 'Pipelines', items: buildItems(pipelines.rows, true) },
    ],
    [agents.rows, buildItems, pipelines.rows],
  );

  const handleSelect = useCallback(
    item => {
      closeMenu();
      if (item.name !== value) onSelect?.(item);
    },
    [closeMenu, onSelect, value],
  );

  const onLoadMore = useCallback(() => {
    if (agents.hasMore) agents.onLoadMore();
    else pipelines.onLoadMore();
  }, [agents, pipelines]);

  const createActions = useMemo(
    () => [
      {
        key: 'agent',
        label: 'Create new agent',
        onClick: () => {
          closeMenu();
          openCreatePage(RouteDefinitions.CreateApplication);
        },
        testId: testId ? `${testId}-create-agent` : undefined,
      },
      {
        key: 'pipeline',
        label: 'Create new pipeline',
        onClick: () => {
          closeMenu();
          openCreatePage(RouteDefinitions.CreatePipeline);
        },
        testId: testId ? `${testId}-create-pipeline` : undefined,
      },
    ],
    [closeMenu, openCreatePage, testId],
  );

  const renderItem = useCallback(
    item => (
      <PickerItemRow
        key={item.key}
        item={item}
        selected={item.name === value}
        onSelect={handleSelect}
        icon={
          <PickerEntityIcon
            source={item.source}
            isApplication
            isPipeline={item.isPipeline}
          />
        }
        data-testid={testId ? `${testId}-option` : undefined}
      />
    ),
    [handleSelect, testId, value],
  );

  return (
    <>
      <PickerTrigger
        label={label}
        hasValue={Boolean(value)}
        isOpen={isOpen}
        disabled={disabled || isVersionLocked}
        onOpen={openMenu}
        onClear={onClear}
        data-testid={testId}
      >
        <Typography
          variant="labelMedium"
          color="inherit"
          noWrap
        >
          {value}
        </Typography>
      </PickerTrigger>
      <PickerMenu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={closeMenu}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search agents and pipelines..."
        createActions={createActions}
        groups={groups}
        renderItem={renderItem}
        isLoading={agents.isFetching || pipelines.isFetching}
        isError={agents.isError || pipelines.isError}
        onRetry={reload}
        onLoadMore={onLoadMore}
        emptyMessage="No agents or pipelines in this project yet"
        noResultsMessage="No agents or pipelines found"
        data-testid={testId ? `${testId}-menu` : undefined}
      />
    </>
  );
});

ProjectAgentPicker.displayName = 'ProjectAgentPicker';

export default ProjectAgentPicker;
