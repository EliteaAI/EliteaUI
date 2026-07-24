import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { Button, Select } from '@/[fsd]/shared/ui';
import SendIcon from '@/components/Icons/SendIcon';

const RunIndexSettingsPanel = memo(props => {
  const {
    runToolOptions,
    selectedRunTool,
    onSelectRunTool,
    runFormFields,
    adjustedRunSchema,
    toolInputVariables,
    onChangeInputVariables,
    onRunSearchTool,
    disabled,
    isRunFormValid,
  } = props;
  const styles = getStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Search settings
        </Typography>
      </Box>
      <Box sx={styles.runSettings}>
        <Select.SingleSelect
          label="Tool"
          required
          value={selectedRunTool ?? ''}
          onValueChange={onSelectRunTool}
          options={runToolOptions}
          showBorder
        />
        {runFormFields.map(key => (
          <ToolkitForm.ToolFormContainer
            key={key}
            fieldKey={key}
            property={adjustedRunSchema.properties[key]}
            toolInputVariables={toolInputVariables}
            schema={adjustedRunSchema}
            onChangeInputVariables={onChangeInputVariables}
            changesDisabled={disabled}
          />
        ))}
      </Box>
      <Box sx={styles.footerRunSlot}>
        <Button.BaseBtn
          variant={Button.BUTTON_VARIANTS.special}
          disabled={!selectedRunTool || !isRunFormValid || disabled}
          onClick={onRunSearchTool}
          startIcon={<SendIcon sx={styles.icon} />}
        >
          Search
        </Button.BaseBtn>
      </Box>
    </Box>
  );
});

RunIndexSettingsPanel.displayName = 'RunIndexSettingsPanel';

/** @type {MuiSx} */
const getStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 0',
    width: '100%',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: ({ palette }) => palette.background.aiProviderAccordion.default,
    borderBottom: ({ palette }) => `0.0625rem solid ${palette.border.table}`,
    flexShrink: 0,
    height: '3rem',
    width: '100%',
  },
  runSettings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
    padding: '1rem 2rem',
    width: '100%',
    maxWidth: '33.5rem',
  },
  footerRunSlot: {
    width: '100%',
    maxWidth: '48rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '3rem',
    padding: '0.5rem 1rem',
    background: ({ palette }) => palette.background.aiProviderAccordion.default,
    borderTop: ({ palette }) => `0.0625rem solid ${palette.border.table}`,
  },
  icon: {
    fontSize: '1rem',
    '& path': { fill: ({ palette }) => palette.primary.main },
    '.Mui-disabled & path': {
      fill: ({ palette }) => palette.icon.fill.disabled,
    },
  },
});

export default RunIndexSettingsPanel;
