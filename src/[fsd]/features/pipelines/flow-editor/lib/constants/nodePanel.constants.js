export const NODE_CONFIG_SECTIONS = {
  basic: 'basic',
  advanced: 'advanced',
};

export const NODE_CONFIG_VIEWS = {
  flow: 'flow',
  yaml: 'yaml',
};

export const NODE_NOT_CONFIGURED_TEXT = 'Not configured';

export const NODE_YAML_ERRORS = {
  singleNode: 'The node YAML must describe exactly one node.',
  typeChange: "Node type can't be changed in the node YAML.",
  renameLocked: "This node can't be renamed.",
};

// Typing pause before a node YAML edit is applied to the pipeline
export const NODE_YAML_APPLY_DELAY_MS = 400;
