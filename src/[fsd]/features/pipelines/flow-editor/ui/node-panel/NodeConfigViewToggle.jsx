import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';

import { NodePanelConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { TabGroupButton } from '@/[fsd]/shared/ui/tab-group-button';
import CodeIcon from '@/assets/code-icon.svg?react';
import FormIcon from '@/assets/form-icon.svg?react';

const { NODE_CONFIG_VIEWS } = NodePanelConstants;

// The YAML view of a single node is delivered separately (#7158), so it stays disabled here
const NodeConfigViewToggle = memo(props => {
  const { value = NODE_CONFIG_VIEWS.flow, onChange } = props;

  const viewButtons = useMemo(
    () => [
      {
        value: NODE_CONFIG_VIEWS.flow,
        icon: <FormIcon fill="currentColor" />,
        tooltip: 'Flow view',
        buttonProps: { 'data-testid': 'pipeline-node-panel-view-flow', 'aria-label': 'Flow view' },
      },
      {
        value: NODE_CONFIG_VIEWS.yaml,
        icon: <CodeIcon fill="currentColor" />,
        tooltip: 'YAML view is coming soon',
        buttonProps: {
          disabled: true,
          'data-testid': 'pipeline-node-panel-view-yaml',
          'aria-label': 'YAML view',
        },
      },
    ],
    [],
  );

  const handleChange = useCallback(
    (_event, newValue) => {
      if (newValue !== value) onChange?.(newValue);
    },
    [onChange, value],
  );

  const styles = nodeConfigViewToggleStyles();

  return (
    <Box sx={styles.root}>
      <TabGroupButton
        arrayBtn={viewButtons}
        value={value}
        onChange={handleChange}
        customSx={styles.button}
      />
    </Box>
  );
});

NodeConfigViewToggle.displayName = 'NodeConfigViewToggle';

/** @type {MuiSx} */
const nodeConfigViewToggleStyles = () => ({
  // The group's items are the buttons' tooltip wrappers; they must not shrink below the 32px buttons
  root: {
    display: 'flex',
    '& .MuiToggleButtonGroup-root': {
      flexShrink: 0,
      width: 'max-content',
    },
    '& .MuiToggleButtonGroup-root > *': {
      flexShrink: 0,
      minWidth: '2rem',
    },
  },
  // Figma: 32x28 per button, 16px icon; fixed so the group never squeezes a button
  button: {
    width: '2rem',
    minWidth: '2rem',
    height: '1.75rem',
    flexShrink: 0,
    boxSizing: 'border-box',
    '& svg': {
      width: '1rem',
      height: '1rem',
      flexShrink: 0,
    },
  },
});

export default NodeConfigViewToggle;
