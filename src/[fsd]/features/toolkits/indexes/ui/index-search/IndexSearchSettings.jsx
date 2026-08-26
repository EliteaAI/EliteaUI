import { memo, useMemo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { Button, ScrollableContainer, Select } from '@/[fsd]/shared/ui';
import SendIcon from '@/components/Icons/SendIcon';

const IndexSearchSettings = memo(props => {
  const {
    searchToolOptions,
    selectedTool,
    onChangeTool,
    selectedToolSchema,
    toolInputVariables,
    onChangeInputVariables,
    onRunSearch,
    isRunning,
    isValidForm,
    blockedReason,
  } = props;
  const styles = indexSearchSettingsStyles();

  const fieldKeys = useMemo(() => Object.keys(selectedToolSchema?.properties || {}), [selectedToolSchema]);

  return (
    <Box sx={styles.root}>
      <ScrollableContainer>
        <Box sx={styles.content}>
          <Box sx={styles.toolSelectContainer}>
            <Select.SingleSelect
              data-testid="index-search-tool-select"
              label="Tool"
              required
              value={selectedTool ?? ''}
              onValueChange={onChangeTool}
              options={searchToolOptions}
              disabled={isRunning}
              showBorder
            />
          </Box>
          {fieldKeys.map(key => (
            <ToolkitForm.ToolFormContainer
              key={key}
              fieldKey={key}
              property={selectedToolSchema.properties[key]}
              toolInputVariables={toolInputVariables}
              schema={selectedToolSchema}
              onChangeInputVariables={onChangeInputVariables}
              changesDisabled={isRunning}
              inputTestId={`index-search-param-${key}-input`}
            />
          ))}
        </Box>
      </ScrollableContainer>
      <Box sx={styles.footer}>
        <Tooltip title={blockedReason ?? ''}>
          <Box component="span">
            <Button.BaseBtn
              data-testid="index-search-run-button"
              variant={Button.BUTTON_VARIANTS.special}
              disabled={!isValidForm || isRunning || Boolean(blockedReason)}
              onClick={onRunSearch}
              startIcon={<SendIcon sx={styles.icon} />}
            >
              Search
            </Button.BaseBtn>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
});

IndexSearchSettings.displayName = 'IndexSearchSettings';

// 511px of fields plus the 32px Figma gutters — caps the column so it cannot straddle the divider.
const CONTENT_MAX_WIDTH = '35.9375rem';

/** @type {MuiSx} */
const indexSearchSettingsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    margin: '0 auto',
    padding: '1rem 2rem',
    gap: '0.5rem',
    '& .index-config-field': {
      marginTop: '0 !important',

      '& .MuiFormControl-root': {
        paddingTop: '0 !important',
      },
    },
  },
  toolSelectContainer: {
    height: '3.75rem',
  },
  footer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    background: palette.background.section,
    borderTop: `0.0625rem solid ${palette.border.table}`,
    flexShrink: 0,
    width: '100%',
    height: '3.25rem',
  }),
  icon: {
    fontSize: '1rem',
    '& path': { fill: ({ palette }) => palette.primary.main },
    '.Mui-disabled & path': {
      fill: ({ palette }) => palette.icon.fill.disabled,
    },
  },
});

export default IndexSearchSettings;
