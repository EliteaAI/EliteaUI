import { memo, useCallback } from 'react';

import { MenuItem, Select } from '@mui/material';

const CatalogSkillVersionSelect = memo(props => {
  const { versions, value, onChange } = props;
  const styles = catalogSkillVersionSelectStyles();

  const handleChange = useCallback(event => onChange(event.target.value), [onChange]);

  return (
    <Select
      size="small"
      value={value ?? ''}
      onChange={handleChange}
      sx={styles.select}
      inputProps={{ 'aria-label': 'Skill version to run' }}
      data-testid="catalog-skill-version-select"
    >
      {versions.map(version => (
        <MenuItem
          key={version.id}
          value={version.id}
        >
          {version.name}
        </MenuItem>
      ))}
    </Select>
  );
});

CatalogSkillVersionSelect.displayName = 'CatalogSkillVersionSelect';

/** @type {MuiSx} */
const catalogSkillVersionSelectStyles = () => ({
  select: {
    minWidth: '8rem',
    marginRight: 'auto',
  },
});

export default CatalogSkillVersionSelect;
