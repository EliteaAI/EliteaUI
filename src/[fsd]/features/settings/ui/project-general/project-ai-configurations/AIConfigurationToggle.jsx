import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { ProjectGeneralConstants } from '@/[fsd]/features/settings/lib/constants';
import { Tab } from '@/[fsd]/shared/ui';

const AIConfigurationToggle = memo(props => {
  const { value, onChange } = props;

  const styles = getStyles();
  const handleChange = useCallback(
    (_event, newValue) => {
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange],
  );

  const themeArrayBtn = [
    {
      value: ProjectGeneralConstants.AIConfigurationTabs.Basic,
      icon: (
        <Box sx={styles.container}>
          <Typography variant="labelSmall">{ProjectGeneralConstants.AIConfigurationTabs.Basic}</Typography>
        </Box>
      ),
    },
    {
      value: ProjectGeneralConstants.AIConfigurationTabs.OpenAITemplate,
      icon: (
        <Box sx={styles.container}>
          <Typography variant="labelSmall">
            {ProjectGeneralConstants.AIConfigurationTabs.OpenAITemplate}
          </Typography>
        </Box>
      ),
    },
  ];

  return (
    <Tab.TabGroupButton
      value={value}
      onChange={handleChange}
      arrayBtn={themeArrayBtn}
      size="medium"
    />
  );
});

AIConfigurationToggle.displayName = 'AIConfigurationToggle';

export default AIConfigurationToggle;

/** @type {MuiSx} */
const getStyles = () => ({
  container: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
});
