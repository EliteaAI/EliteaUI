import { memo, useCallback, useState } from 'react';

import { Menu, MenuItem, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/components/Icons/PlusIcon';

// Picking a parameter only reveals its field; nothing is written to YAML until a value is entered
const AddOptionalParameterButton = memo(props => {
  const { options = [], onAdd, disabled, testIdPrefix } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  const onOpen = useCallback(event => setAnchorEl(event.currentTarget), []);
  const onClose = useCallback(() => setAnchorEl(null), []);

  const onSelect = useCallback(
    key => () => {
      onAdd(key);
      setAnchorEl(null);
    },
    [onAdd],
  );

  if (!options.length) return null;

  const styles = addOptionalParameterButtonStyles();

  return (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.secondary}
        startIcon={<PlusIcon sx={styles.icon} />}
        onClick={onOpen}
        disabled={disabled}
        sx={styles.button}
        data-testid={testIdPrefix ? `${testIdPrefix}-add-optional-parameter` : undefined}
      >
        Add optional parameter
      </Button.BaseBtn>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
      >
        {options.map(({ key, label }) => (
          <MenuItem
            key={key}
            onClick={onSelect(key)}
            data-testid={testIdPrefix ? `${testIdPrefix}-optional-parameter-${key}` : undefined}
          >
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              {label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});

AddOptionalParameterButton.displayName = 'AddOptionalParameterButton';

/** @type {MuiSx} */
const addOptionalParameterButtonStyles = () => ({
  button: {
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: '1rem',
  },
});

export default AddOptionalParameterButton;
