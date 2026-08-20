import { memo, useCallback } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { Button, Input } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const CaseVariablesEditor = memo(props => {
  const { rows = [], onChange } = props;

  const handleField = useCallback(
    (index, field, value) => {
      const next = rows.map((row, i) => (i === index ? { ...row, [field]: value } : row));
      onChange?.(next);
    },
    [rows, onChange],
  );

  const handleAdd = useCallback(() => {
    onChange?.([...rows, { key: '', value: '' }]);
  }, [rows, onChange]);

  const handleRemove = useCallback(
    index => {
      onChange?.(rows.filter((_, i) => i !== index));
    },
    [rows, onChange],
  );

  const styles = caseVariablesEditorStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="case-variables-editor"
    >
      <Typography variant="labelMedium">Variables</Typography>
      {rows.length === 0 ? (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          No variables.
        </Typography>
      ) : (
        rows.map((row, index) => (
          <Box
            key={index}
            sx={styles.row}
          >
            <Input.InputBase
              fullWidth
              variant="standard"
              label="Key"
              value={row.key}
              onChange={event => handleField(index, 'key', event.target.value)}
              data-testid={`case-variable-key-${index}`}
            />
            <Input.InputBase
              fullWidth
              variant="standard"
              label="Value"
              value={row.value}
              onChange={event => handleField(index, 'value', event.target.value)}
              data-testid={`case-variable-value-${index}`}
            />
            <Tooltip
              title="Remove"
              placement="top"
            >
              <IconButton
                size="small"
                onClick={() => handleRemove(index)}
                data-testid={`case-variable-remove-${index}`}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ))
      )}
      <Box sx={styles.addRow}>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.secondary}
          onClick={handleAdd}
          data-testid="case-variable-add"
        >
          + Add variable
        </Button.BaseBtn>
      </Box>
    </Box>
  );
});

CaseVariablesEditor.displayName = 'CaseVariablesEditor';

/** @type {MuiSx} */
const caseVariablesEditorStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.75rem',
  },
  addRow: {
    display: 'flex',
  },
});

export default CaseVariablesEditor;
