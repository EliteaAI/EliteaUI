import { useMemo } from 'react';

import { adjustIndexDataSchema } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { indexSearchToolOptions } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { ToolkitChatHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useToolkitTestRunner } from '@/[fsd]/features/toolkits/lib/hooks';

// The route already fixes which index is searched, and the chat hook spreads tool params after the
// collection it injects — a surviving index_name would win and silently search another index.
const adjustSearchSchema = schema =>
  ToolkitChatHelpers.omitSchemaProperties(adjustIndexDataSchema(schema, { query: { clipboard: true } }), [
    'index_name',
  ]);

/**
 * The runner is handed the index name and nothing else on purpose. With the live row it would
 * inherit that row's `state`, `conversation_id` and `task_id`, and `useToolkitChat` would recover a
 * running index's transcript into these results.
 */
export const useIndexSearchRunner = ({ toolkitId, indexName, selectedIndexTools, values }) => {
  const searchIndex = useMemo(() => ({ metadata: { collection: indexName } }), [indexName]);

  const searchToolOptions = useMemo(() => indexSearchToolOptions(selectedIndexTools), [selectedIndexTools]);

  const runner = useToolkitTestRunner({
    toolkitId,
    values,
    index: searchIndex,
    adjustSchema: adjustSearchSchema,
  });

  return { ...runner, searchToolOptions };
};
