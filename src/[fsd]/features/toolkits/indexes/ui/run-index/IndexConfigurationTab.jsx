import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { ScrollableContainer } from '@/[fsd]/shared/ui';

const IndexConfigurationTab = memo(props => {
  const { configFields, configSchema, configInputVariables, onChangeInputVariables, disabled } = props;
  const styles = indexConfigurationTabStyles();

  const isSchemaLoading = configFields.length === 0;
  const editableFields = configFields.filter(key => key !== 'index_name');
  const hasNothingToConfigure = !isSchemaLoading && editableFields.length === 0;

  return (
    <Box
      sx={styles.root}
      data-testid="index-configuration-tab"
    >
      <ScrollableContainer>
        <Box sx={styles.content}>
          {isSchemaLoading && (
            <Box sx={styles.statusRow}>
              <CircularProgress size={20} />
            </Box>
          )}
          {hasNothingToConfigure && (
            <Box
              sx={styles.statusRow}
              data-testid="index-configuration-empty"
            >
              <Typography
                variant="bodyMedium"
                sx={styles.emptyMessage}
              >
                No additional configuration required.
              </Typography>
            </Box>
          )}
          {editableFields.map(key => (
            <ToolkitForm.ToolFormContainer
              key={key}
              fieldKey={key}
              property={configSchema.properties[key]}
              toolInputVariables={configInputVariables}
              schema={configSchema}
              onChangeInputVariables={onChangeInputVariables}
              changesDisabled={disabled}
              inputTestId={`index-config-param-${key}-input`}
            />
          ))}
        </Box>
      </ScrollableContainer>
    </Box>
  );
});

IndexConfigurationTab.displayName = 'IndexConfigurationTab';

/** @type {MuiSx} */
const indexConfigurationTabStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    padding: '1rem 2rem',
    '& .index-config-field': {
      marginTop: '0 !important',

      '& .MuiFormControl-root': {
        paddingTop: '0 !important',
      },
    },
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem 0',
  },
  emptyMessage: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default IndexConfigurationTab;
