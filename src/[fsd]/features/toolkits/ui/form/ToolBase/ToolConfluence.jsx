import { memo } from 'react';

import ToolBase from './ToolBase';

const CONFLUENCE_EXCLUDED_FIELDS = ['cloud'];
const CONFLUENCE_ADVANCED_FIELDS = [
  'max_pages',
  'number_of_retries',
  'min_retry_seconds',
  'max_retry_seconds',
  'custom_headers',
];
const CONFLUENCE_PRIORITY_FIELDS = [
  'confluence_configuration',
  'pgvector_configuration',
  'embedding_model',
  'api_version',
  'space',
  'limit',
  'labels',
];

const ToolConfluence = memo(props => (
  <ToolBase
    {...props}
    excludedFields={[...(props.excludedFields || []), ...CONFLUENCE_EXCLUDED_FIELDS]}
    advancedFields={CONFLUENCE_ADVANCED_FIELDS}
    priorityFieldsOrder={CONFLUENCE_PRIORITY_FIELDS}
  />
));

ToolConfluence.displayName = 'ToolConfluence';

export default ToolConfluence;
