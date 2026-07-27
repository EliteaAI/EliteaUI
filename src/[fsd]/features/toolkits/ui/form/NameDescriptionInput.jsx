import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { useToolkitNameProp } from '@/[fsd]/features/toolkits/lib/hooks';
import { useFieldFocus } from '@/[fsd]/shared/lib/hooks';
import { Input, Text } from '@/[fsd]/shared/ui';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH, PROMPT_PAYLOAD_KEY } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import { useIconMetaTooltipType } from '@/hooks/toolkit/useIconMetaTooltipType.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const NameDescriptionInput = memo(props => {
  const {
    type,
    name,
    toolkitName,
    description,
    editField,
    showValidation,
    toolErrors,
    showOnlyRequiredFields = false,
    showOnlyConfigurationFields = false,
    showNameFieldForcedly = false,
    showToolkitIcon = false,
    hideNameInput = false,
    configuration_title = '',
    isMCP = false,
    disabled,
  } = props;

  const styles = nameDescriptionInputStyles();
  const selectedProjectId = useSelectedProjectId();
  const { toolkitNameProp, nameIsRequired, descriptionIsRequired } = useToolkitNameProp(type);
  const { toggleFieldFocus, isFocused } = useFieldFocus();

  const handleInputChange = useCallback(
    field => event => {
      editField(field, event.target.value);
    },
    [editField],
  );
  const iconMeta = useIconMetaTooltipType(type, isMCP);

  //@todo: need to consider the condition to show and not to show for credentials
  if (showOnlyConfigurationFields) {
    return null;
  }

  //@todo: need to check the condition for all the tools
  const isToolNameVisible =
    !hideNameInput && (showOnlyRequiredFields ? nameIsRequired : nameIsRequired || !toolkitNameProp);
  const isDescriptionVisible = showOnlyRequiredFields ? descriptionIsRequired : !toolkitNameProp;
  const nameValue = nameIsRequired ? name : toolkitName || name || configuration_title;

  return (
    <>
      <Box sx={styles.nameContainer}>
        {showToolkitIcon && (
          <EntityIcon
            icon={iconMeta}
            entityType={!isMCP ? 'toolkit' : 'mcp'}
            projectId={selectedProjectId}
            editable={false}
          />
        )}
        {(isToolNameVisible || showNameFieldForcedly) && (
          <Box sx={styles.nameInputContainer}>
            <Input.StyledInputEnhancer
              disabled={!nameIsRequired || disabled}
              required={nameIsRequired}
              label="Toolkit Name"
              value={nameValue ?? ''}
              onChange={handleInputChange('name')}
              error={showValidation && toolErrors?.name}
              helperText={showValidation && toolErrors?.name && 'Field is required'}
              inputProps={{ maxLength: MAX_NAME_LENGTH }}
              onFocus={() => toggleFieldFocus(PROMPT_PAYLOAD_KEY.name)}
              onBlur={() => toggleFieldFocus(null)}
              hasActionsToolBar
              copyMessage="The name has been copied to the clipboard."
              showFullScreenAction={false}
              showExpandAction={false}
            />
            {isFocused(PROMPT_PAYLOAD_KEY.name) && MAX_NAME_LENGTH === nameValue?.length && (
              <Text.CharacterCounter
                value={nameValue}
                maxLength={MAX_NAME_LENGTH}
                hideMaxLimitMessage
                sx={styles.nameLengthMessage}
              />
            )}
          </Box>
        )}
      </Box>

      {isDescriptionVisible && (
        <Box sx={styles.descriptionContainer}>
          <Input.StyledInputEnhancer
            autoComplete="off"
            hasActionsToolBar
            id="tool-description"
            label="Description"
            multiline
            maxRows={15}
            value={description ?? ''}
            onChange={handleInputChange('description')}
            error={showValidation && toolErrors?.description}
            helperText={showValidation && toolErrors?.description && 'Field is required'}
            inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
            disabled={disabled}
            language="text"
            fieldName="Description"
            onFocus={() => toggleFieldFocus(PROMPT_PAYLOAD_KEY.description)}
            onBlur={() => toggleFieldFocus(null)}
          />
          {isFocused(PROMPT_PAYLOAD_KEY.description) && description?.length > 0 && (
            <Text.CharacterCounter
              value={description}
              maxLength={MAX_DESCRIPTION_LENGTH}
              hideMaxLimitMessage
              sx={styles.descriptionLengthMessage}
            />
          )}
        </Box>
      )}
    </>
  );
});

/** @type {MuiSx} */
const nameDescriptionInputStyles = () => ({
  nameContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.75rem',
  },
  nameInputContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  nameLengthMessage: {
    textAlign: 'right',
    width: '100%',
    position: 'relative',
    top: '0.25rem',
  },
  descriptionContainer: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  descriptionLengthMessage: {
    textAlign: 'right',
    width: '100%',
    marginTop: '0.25rem',
  },
});

NameDescriptionInput.displayName = 'NameDescriptionInput';

export default NameDescriptionInput;
