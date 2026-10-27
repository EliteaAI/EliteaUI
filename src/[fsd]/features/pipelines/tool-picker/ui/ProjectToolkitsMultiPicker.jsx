import { memo, useCallback, useContext, useMemo } from 'react';

import { Chip, Typography } from '@mui/material';

import { TOOL_REF_KINDS } from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';
import { buildToolkitPickerItems } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/pickerItems.helpers';
import {
  collectToolReferences,
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
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import RouteDefinitions from '@/routes';

import PickerEntityIcon from './PickerEntityIcon';
import PickerItemRow from './PickerItemRow';
import PickerMcpStatus from './PickerMcpStatus';
import PickerMenu from './PickerMenu';
import PickerTrigger from './PickerTrigger';

// toolkits.helpers by file: the toolkits barrel reaches the node components, which import this slice back

/**
 * Picks toolkits and MCPs of the project for an LLM node. The menu stays open, so several can be toggled.
 * @param {string[]} props.value toolkit names (the node's `tool_names` keys)
 * @param {(source: object, toolkitName: string, mcp: boolean) => void} props.onAdd
 * @param {(toolkitName: string) => void} props.onRemove
 * @param {() => void} props.onClear removes every toolkit in one update
 */
const ProjectToolkitsMultiPicker = memo(props => {
  const { label, value = [], onAdd, onRemove, onClear, disabled = false, 'data-testid': testId } = props;

  const { yamlJsonObject } = useContext(FlowEditorContext);
  const isVersionLocked = useIsVersionLocked();
  const isMcpVisible = useIsMcpVisible();
  const { tools, getToolkitName } = usePipelineAttachments();
  const { anchorEl, isOpen, hasOpened, search, setSearch, query, openMenu, closeMenu } = usePickerMenu();
  const toolkits = useProjectToolkitsList({ mcp: false, query, skip: !hasOpened });
  const mcps = useProjectToolkitsList({ mcp: true, query, skip: !hasOpened || !isMcpVisible });

  const reload = useCallback(() => {
    toolkits.reload();
    if (isMcpVisible) mcps.reload();
  }, [isMcpVisible, mcps, toolkits]);
  const openCreatePage = useCreateInNewTab(reload);

  const usedNames = useMemo(
    () => getReferencedNames(collectToolReferences(yamlJsonObject), TOOL_REF_KINDS.toolkit),
    [yamlJsonObject],
  );

  const buildItems = useCallback(
    (rows, mcp) =>
      buildToolkitPickerItems({
        rows,
        attachedTools: tools.filter(tool => !isApplicationTool(tool) && isMcpAttachment(tool) === mcp),
        usedNames,
        query: search,
        getToolkitName,
        getLabel: getToolkitDisplayName,
      }).map(item => ({ ...item, mcp })),
    [getToolkitName, search, tools, usedNames],
  );

  const groups = useMemo(
    () => [
      { key: 'toolkits', title: 'Toolkits', items: buildItems(toolkits.rows, false) },
      ...(isMcpVisible ? [{ key: 'mcps', title: 'MCPs', items: buildItems(mcps.rows, true) }] : []),
    ],
    [buildItems, isMcpVisible, mcps.rows, toolkits.rows],
  );

  const handleToggle = useCallback(
    item => {
      if (value.includes(item.name)) onRemove?.(item.name);
      else onAdd?.(item.source, item.name, item.mcp);
    },
    [onAdd, onRemove, value],
  );

  const onLoadMore = useCallback(() => {
    if (toolkits.hasMore) toolkits.onLoadMore();
    else if (isMcpVisible) mcps.onLoadMore();
  }, [isMcpVisible, mcps, toolkits]);

  const createActions = useMemo(
    () => [
      {
        key: 'toolkit',
        label: 'Create new toolkit',
        onClick: () => {
          closeMenu();
          openCreatePage(RouteDefinitions.CreateToolkit);
        },
        testId: testId ? `${testId}-create-toolkit` : undefined,
      },
      ...(isMcpVisible
        ? [
            {
              key: 'mcp',
              label: 'Create new MCP',
              onClick: () => {
                closeMenu();
                openCreatePage(RouteDefinitions.CreateMCP);
              },
              testId: testId ? `${testId}-create-mcp` : undefined,
            },
          ]
        : []),
    ],
    [closeMenu, isMcpVisible, openCreatePage, testId],
  );

  const renderItem = useCallback(
    item => (
      <PickerItemRow
        key={item.key}
        item={item}
        selected={value.includes(item.name)}
        onSelect={handleToggle}
        icon={
          <PickerEntityIcon
            source={item.source}
            mcp={item.mcp}
          />
        }
        status={item.mcp ? <PickerMcpStatus mcp={item.source} /> : null}
        data-testid={testId ? `${testId}-option` : undefined}
      />
    ),
    [handleToggle, testId, value],
  );

  const styles = projectToolkitsMultiPickerStyles();

  return (
    <>
      <PickerTrigger
        label={label ?? (isMcpVisible ? 'Toolkits & MCPs' : 'Toolkits')}
        hasValue={value.length > 0}
        isOpen={isOpen}
        disabled={disabled || isVersionLocked}
        onOpen={openMenu}
        onClear={onClear}
        data-testid={testId}
      >
        {value.map(name => (
          <Chip
            key={name}
            size="small"
            sx={styles.chip}
            label={
              <Typography
                variant="labelSmall"
                color="text.secondary"
              >
                {name}
              </Typography>
            }
            onDelete={disabled || isVersionLocked ? undefined : () => onRemove?.(name)}
            onMouseDown={event => event.stopPropagation()}
            onClick={event => event.stopPropagation()}
          />
        ))}
      </PickerTrigger>
      <PickerMenu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={closeMenu}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={isMcpVisible ? 'Search toolkits and MCPs...' : 'Search toolkits...'}
        createActions={createActions}
        groups={groups}
        renderItem={renderItem}
        isLoading={toolkits.isFetching || mcps.isFetching}
        isError={toolkits.isError || mcps.isError}
        onRetry={reload}
        onLoadMore={onLoadMore}
        emptyMessage="No toolkits in this project yet"
        noResultsMessage="No toolkits found"
        data-testid={testId ? `${testId}-menu` : undefined}
      />
    </>
  );
});

ProjectToolkitsMultiPicker.displayName = 'ProjectToolkitsMultiPicker';

/** @type {MuiSx} */
const projectToolkitsMultiPickerStyles = () => ({
  chip: ({ palette }) => ({
    maxWidth: '100%',
    backgroundColor: palette.components.chip.background.default,
  }),
});

export default ProjectToolkitsMultiPicker;
