import { memo, useCallback, useContext, useMemo } from 'react';

import { Typography } from '@mui/material';

import { TOOL_REF_KINDS } from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';
import { buildToolkitPickerItems } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/pickerItems.helpers';
import {
  collectToolReferences,
  getAttachmentRefName,
  getReferencedNames,
  isApplicationTool,
  isMcpAttachment,
} from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/pipelineToolUsage.helpers';
import { useCreateInNewTab } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/useCreateInNewTab.hooks';
import { useIsVersionLocked } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/useIsVersionLocked.hooks';
import { usePickerMenu } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/usePickerMenu.hooks';
import { usePipelineAttachments } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/usePipelineAttachments.hooks';
import { useProjectToolkitsList } from '@/[fsd]/features/pipelines/tool-picker/lib/hooks/useProjectToolkitsList.hooks';
import { getToolkitDisplayName } from '@/[fsd]/features/toolkits/lib/helpers/toolkits.helpers';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import RouteDefinitions from '@/routes';

import PickerEntityIcon from './PickerEntityIcon';
import PickerItemRow from './PickerItemRow';
import PickerMcpStatus from './PickerMcpStatus';
import PickerMenu from './PickerMenu';
import PickerTrigger from './PickerTrigger';

// toolkits.helpers by file: the toolkits barrel reaches the node components, which import this slice back

/**
 * Picks any toolkit (or MCP, with `mcp`) of the project for a node. Picking one the pipeline doesn't have
 * yet attaches it on Save; see `usePipelineAttachments`.
 * @param {(source: object, toolkitName: string) => void} props.onSelect gets the list row (or attached tool)
 *   and the name the node must write into `toolkit_name`
 */
const ProjectToolkitPicker = memo(props => {
  const {
    mcp = false,
    label = mcp ? 'MCP' : 'Toolkit',
    value,
    onSelect,
    onClear,
    disabled = false,
    'data-testid': testId,
  } = props;

  const { yamlJsonObject } = useContext(FlowEditorContext);
  const isVersionLocked = useIsVersionLocked();
  const { tools, getToolkitName } = usePipelineAttachments();
  const { anchorEl, isOpen, hasOpened, search, setSearch, query, openMenu, closeMenu } = usePickerMenu();
  const list = useProjectToolkitsList({ mcp, query, skip: !hasOpened });
  const openCreatePage = useCreateInNewTab(list.reload);

  const attachedTools = useMemo(
    () => tools.filter(tool => !isApplicationTool(tool) && isMcpAttachment(tool) === mcp),
    [mcp, tools],
  );
  const usedNames = useMemo(
    () => getReferencedNames(collectToolReferences(yamlJsonObject), TOOL_REF_KINDS.toolkit),
    [yamlJsonObject],
  );

  const items = useMemo(
    () =>
      buildToolkitPickerItems({
        rows: list.rows,
        attachedTools,
        usedNames,
        query: search,
        getToolkitName,
        getLabel: getToolkitDisplayName,
      }),
    [attachedTools, getToolkitName, list.rows, search, usedNames],
  );

  const selectedTool = useMemo(
    () => (value ? attachedTools.find(tool => getAttachmentRefName(tool, getToolkitName) === value) : null),
    [attachedTools, getToolkitName, value],
  );

  const handleSelect = useCallback(
    item => {
      closeMenu();
      if (item.name !== value) onSelect?.(item.source, item.name);
    },
    [closeMenu, onSelect, value],
  );

  const handleCreate = useCallback(() => {
    closeMenu();
    openCreatePage(mcp ? RouteDefinitions.CreateMCP : RouteDefinitions.CreateToolkit);
  }, [closeMenu, mcp, openCreatePage]);

  const createActions = useMemo(
    () => [
      {
        key: 'create',
        label: 'Create new',
        onClick: handleCreate,
        testId: testId ? `${testId}-create-new` : undefined,
      },
    ],
    [handleCreate, testId],
  );

  const groups = useMemo(() => [{ key: 'toolkits', title: label, items }], [items, label]);

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
            mcp={mcp}
          />
        }
        status={mcp ? <PickerMcpStatus mcp={item.source} /> : null}
        data-testid={testId ? `${testId}-option` : undefined}
      />
    ),
    [handleSelect, mcp, testId, value],
  );

  const entityLabel = mcp ? 'MCPs' : 'toolkits';

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
          {selectedTool ? getToolkitDisplayName(selectedTool) || value : value}
        </Typography>
      </PickerTrigger>
      <PickerMenu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={closeMenu}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${entityLabel}`}
        createActions={createActions}
        groups={groups}
        renderItem={renderItem}
        isLoading={list.isFetching}
        isError={list.isError}
        onRetry={list.reload}
        onLoadMore={list.onLoadMore}
        emptyMessage={`No ${entityLabel} in this project yet`}
        noResultsMessage={`No ${entityLabel} found`}
        data-testid={testId ? `${testId}-menu` : undefined}
      />
    </>
  );
});

ProjectToolkitPicker.displayName = 'ProjectToolkitPicker';

export default ProjectToolkitPicker;
