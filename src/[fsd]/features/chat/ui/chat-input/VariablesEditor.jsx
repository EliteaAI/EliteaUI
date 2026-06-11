import { memo, useCallback, useState } from 'react';

import { Button, Tooltip } from '@mui/material';

import VariablesIcon from '@/assets/variables-icon.svg?react';
import VariableDialog from '@/components/VariableDialog.jsx';

const VariablesEditor = memo(props => {
  const { variables, onChange, isSmallView } = props;

  const [anchorEl, setAnchorEl] = useState(null);
  const variableDialogOpen = Boolean(anchorEl);

  const handleOpenDialogClick = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleChangeVariables = useCallback(
    newVariables => {
      onChange(newVariables);
      handleClose();
    },
    [onChange, handleClose],
  );

  return (
    <>
      <Tooltip
        placement="top"
        title="Set variables"
      >
        <Button
          size="small"
          aria-expanded={variableDialogOpen ? 'true' : undefined}
          aria-label="variables selector menu"
          aria-haspopup="menu"
          onClick={handleOpenDialogClick}
        >
          {isSmallView ? <VariablesIcon style={styles.icon} /> : 'Variables'}
        </Button>
      </Tooltip>
      <VariableDialog
        variables={variables}
        open={variableDialogOpen}
        onOK={handleChangeVariables}
        onCancel={handleClose}
      />
    </>
  );
});

VariablesEditor.displayName = 'VariablesEditor';

/**
 * @type MuiSx
 */
const styles = {
  icon: { fontSize: '1rem' },
};

export default VariablesEditor;
