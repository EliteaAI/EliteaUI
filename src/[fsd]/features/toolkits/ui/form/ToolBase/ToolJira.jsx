import { memo } from 'react';

import ToolBase from './ToolBase';

const JIRA_EXCLUDED_FIELDS = ['cloud'];
const JIRA_ADVANCED_FIELDS = ['verify_ssl', 'additional_fields', 'custom_headers'];
const JIRA_PRIORITY_FIELDS = [
  'jira_configuration',
  'pgvector_configuration',
  'embedding_model',
  'api_version',
  'limit',
  'labels',
];

const ToolJira = memo(props => (
  <ToolBase
    {...props}
    excludedFields={[...(props.excludedFields || []), ...JIRA_EXCLUDED_FIELDS]}
    advancedFields={JIRA_ADVANCED_FIELDS}
    priorityFieldsOrder={JIRA_PRIORITY_FIELDS}
  />
));

ToolJira.displayName = 'ToolJira';

export default ToolJira;
