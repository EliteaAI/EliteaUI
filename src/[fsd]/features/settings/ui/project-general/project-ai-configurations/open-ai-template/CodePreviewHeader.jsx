import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';
import CloseIcon from '@/components/Icons/CloseIcon';

const CodePreviewHeader = memo(
  ({
    selectedLanguage,
    onLanguageChange,
    onClose,
    showCloseButton,
    codeExampleLabels,
    models,
    selectedModel,
    onChangeModel,
  }) => {
    const styles = getStyles();
    const languageOptions = useMemo(
      () =>
        Object.keys(codeExampleLabels).map(key => ({
          label: codeExampleLabels[key],
          value: key,
        })),
      [codeExampleLabels],
    );
    const modelOptions = useMemo(
      () =>
        models.map(model => ({
          value: `${model.name}<<>>${model.project_id}`,
          label: model.display_name || model.name,
        })),
      [models],
    );
    const onHandleChangeModel = useCallback(
      selectedValue => {
        const [modelName, projectId] = selectedValue.split('<<>>');
        const foundModel = models.find(
          model => model.name === modelName && String(model.project_id) === projectId,
        );
        if (foundModel) {
          onChangeModel(foundModel);
        }
      },
      [models, onChangeModel],
    );

    return (
      <Box sx={styles.headerContainer}>
        <Box sx={styles.controlsContainer}>
          <Select.SingleSelect
            separateLabel
            label="Model:"
            value={`${selectedModel?.name}<<>>${selectedModel?.project_id}`}
            onValueChange={onHandleChangeModel}
            options={modelOptions}
            disabled={false}
          />
          <Select.SingleSelect
            separateLabel
            label="Code:"
            value={selectedLanguage}
            onValueChange={onLanguageChange}
            options={languageOptions}
            disabled={false}
          />
          {showCloseButton && (
            <IconButton
              variant="elitea"
              color="secondary"
              onClick={onClose}
            >
              <CloseIcon sx={styles.closeIcon} />
            </IconButton>
          )}
        </Box>
      </Box>
    );
  },
);

CodePreviewHeader.displayName = 'CodePreviewHeader';

/** @type {MuiSx} */
const getStyles = () => ({
  headerContainer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.sidebarDivider}`,
    minHeight: '3rem',
    flexShrink: 0,
  }),

  controlsContainer: () => ({
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  }),

  closeIcon: ({ palette }) => ({
    fontSize: '1rem',
    fill: palette.icon.fill.default,
  }),
});

export default CodePreviewHeader;
