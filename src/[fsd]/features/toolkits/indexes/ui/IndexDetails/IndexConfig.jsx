import { memo, useEffect, useMemo } from 'react';

import { Box, Button } from '@mui/material';

import { IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { Select } from '@/[fsd]/shared/ui';
import { ContentContainer } from '@/pages/Common/Components';

const IndexConfig = memo(props => {
  const {
    schema,
    configInitialized,
    initializeDefaultConfigValues,
    toolInputVariables,
    onChangeInputVariables,
    toolsConfig = null,
    isValidForm,
    changesDisabled,
    withNavigation,
    isRunningTool,
    ...wrapperProps
  } = props;

  const styles = indexConfigStyles(withNavigation);

  useEffect(() => {
    if (schema?.properties && !configInitialized.current) initializeDefaultConfigValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, initializeDefaultConfigValues]);

  const configValues = useMemo(() => Object.keys(schema?.properties || {}), [schema]);

  const toolsOptions = useMemo(() => {
    if (!toolsConfig) return [];

    return [
      { label: 'Search Index', value: IndexesToolsEnum.searchIndexData },
      { label: 'Stepback Search Index', value: IndexesToolsEnum.stepbackSearchIndex },
      { label: 'Stepback Summary Index', value: IndexesToolsEnum.stepbackSummaryIndex },
    ].filter(opt => toolsConfig.selectedIndexTools.includes(opt.value));
  }, [toolsConfig]);

  return (
    <Box
      sx={styles.wrapper}
      {...wrapperProps}
    >
      <ContentContainer sx={styles.contentContainer}>
        <Box sx={styles.scrollableContainer}>
          {toolsConfig && (
            <Box>
              <Select.SingleSelect
                label="Tool"
                value={toolsConfig.selectedRunTool ?? ''}
                onValueChange={selectedValue => toolsConfig.onChangeTool({ value: selectedValue })}
                options={toolsOptions}
                showBorder
              />
            </Box>
          )}
          {configValues.map(key => (
            <ToolkitForm.ToolFormContainer
              key={key}
              fieldKey={key}
              property={schema.properties[key]}
              toolInputVariables={toolInputVariables}
              schema={schema}
              onChangeInputVariables={onChangeInputVariables}
              changesDisabled={changesDisabled}
            />
          ))}
        </Box>
        {toolsConfig && (
          <Box sx={styles.runButton}>
            <Button
              variant="special"
              fullWidth
              disabled={!isValidForm || isRunningTool}
              onClick={toolsConfig.handleRunTool}
              sx={{ width: '3.625rem' }}
            >
              Run
            </Button>
          </Box>
        )}
      </ContentContainer>
    </Box>
  );
});

IndexConfig.displayName = 'IndexConfig';

/** @type {MuiSx} */
const indexConfigStyles = withNavigation => ({
  wrapper: {
    flexGrow: 1,
    padding: '0 !important',
  },
  contentContainer: {
    // 3.75rem main header
    // 3.75rem details header
    // 3rem details vertical paddings
    // 1.75rem tab switching header
    // 1.5rem margin from the tab switching
    height: `calc(100vh - 3.75rem - 3.75rem - 3rem${withNavigation ? ' - 1.75rem - 1.5rem' : ''})`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  scrollableContainer: ({ palette }) => ({
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative',

    ...(withNavigation && { marginBottom: '1rem' }),

    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: palette.divider,
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: palette.action.hover,
    },
  }),
  runButton: {
    display: 'flex',
    position: 'abolute',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 0,
    left: '50%',
    width: '100%',
    height: '1.75rem',
  },
});

export default IndexConfig;
