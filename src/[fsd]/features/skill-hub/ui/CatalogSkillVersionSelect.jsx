import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';

const VERSION_SELECT_INPUT_PROPS = {
  'aria-label': 'Skill version to run',
  'data-testid': 'catalog-skill-version-select',
};

const CatalogSkillVersionSelect = memo(props => {
  const { versions, value, onChange } = props;
  const styles = catalogSkillVersionSelectStyles();

  const versionOptions = useMemo(
    () => versions.map(version => ({ label: version.name, value: version.id })),
    [versions],
  );

  return (
    <Box>
      <SingleSelect
        label=""
        value={value ?? ''}
        options={versionOptions}
        onValueChange={onChange}
        sx={styles.select}
        inputProps={VERSION_SELECT_INPUT_PROPS}
      />
    </Box>
  );
});

CatalogSkillVersionSelect.displayName = 'CatalogSkillVersionSelect';

/** @type {MuiSx} */
const catalogSkillVersionSelectStyles = () => ({
  select: {
    width: 'fit-content',
    marginRight: 'auto',
  },
});

export default CatalogSkillVersionSelect;
