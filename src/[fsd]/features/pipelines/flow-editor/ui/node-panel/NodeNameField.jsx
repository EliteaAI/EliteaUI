import { memo, useCallback, useEffect, useState } from 'react';

import { TextField } from '@mui/material';

import { NodeFieldInfoConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { useNodeRename } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { Label } from '@/[fsd]/shared/ui';

const { COMMON_NODE_FIELD_INFO, NODE_FIELD_KEYS } = NodeFieldInfoConstants;

// MUI TextField on purpose: the shared Input.InputBase blurs on change, which would rename after one keystroke
const NodeNameField = memo(props => {
  const { name, type, onRenamed, isLocked } = props;

  const { canRename, getNameError, renameNode } = useNodeRename({ name, type, onRenamed, isLocked });
  const [draftName, setDraftName] = useState(name);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraftName(name);
    setError('');
  }, [name]);

  const onChange = useCallback(
    event => {
      const { value } = event.target;
      setDraftName(value);
      setError(value === name ? '' : getNameError(value) || '');
    },
    [getNameError, name],
  );

  const commit = useCallback(() => {
    if (draftName === name) return;
    const renameError = renameNode(draftName);
    if (renameError) setError(renameError);
  }, [draftName, name, renameNode]);

  const onKeyDown = useCallback(event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.target.blur();
    }
  }, []);

  const styles = nodeNameFieldStyles();

  return (
    <TextField
      value={draftName}
      onChange={onChange}
      onBlur={commit}
      onKeyDown={onKeyDown}
      label={
        <Label.InfoLabelWithTooltip
          label="Name"
          tooltip={COMMON_NODE_FIELD_INFO[NODE_FIELD_KEYS.name]}
          pinnable
          required
          inheritLabel
          inheritColor
        />
      }
      required
      fullWidth
      variant="standard"
      autoComplete="off"
      disabled={!canRename}
      error={Boolean(error)}
      helperText={error || undefined}
      sx={styles.root}
      slotProps={{ htmlInput: { 'data-testid': 'pipeline-node-panel-name-input' } }}
    />
  );
});

NodeNameField.displayName = 'NodeNameField';

/** @type {MuiSx} */
const nodeNameFieldStyles = () => ({
  root: ({ palette }) => ({
    '& .MuiFormLabel-root': {
      color: palette.text.primary,
      display: 'flex',
      pointerEvents: 'auto',
    },
    // The asterisk is part of the label, before the info icon
    '& .MuiFormLabel-asterisk': {
      display: 'none',
    },
  }),
});

export default NodeNameField;
