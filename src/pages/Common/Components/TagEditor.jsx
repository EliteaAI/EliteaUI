import { useCallback } from 'react';

import AutoCompleteDropDown from '@/ComponentsLib/AutoCompleteDropDown';
import {
  NormalSingleTagNameInputRegExp,
  NormalTagNameInputRegExp,
  TAG_NAME_MAX_LENGTH,
} from '@/common/constants';
import { useTheme } from '@emotion/react';

export default function TagEditor({
  tagList,
  stateTags,
  onChangeTags,
  disabled,
  label = 'Tags',
  displayName = 'Tag',
  initialTagValue = { data: { color: 'red' } },
  ...props
}) {
  const theme = useTheme();
  const validateTagName = useCallback(
    (name, setHelpText) => {
      setHelpText(
        !name?.trim()
          ? `${displayName} should not be all white spaces`
          : name?.trim().length > TAG_NAME_MAX_LENGTH
            ? `${displayName} length should be less than ${TAG_NAME_MAX_LENGTH} symbols`
            : 'Only alphanumeric characters, white space, comma and underscore allowed',
      );
    },
    [displayName],
  );
  const handleOnChangeTags = useCallback(
    newTags => {
      onChangeTags(newTags.map(tag => tagList?.rows?.find(t => t.name === tag.name) || tag));
    },
    [onChangeTags, tagList],
  );

  return (
    <AutoCompleteDropDown
      optionList={
        tagList?.rows
          ?.map(tag => tag)
          ?.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())) || []
      }
      selectedOptions={stateTags}
      onChangedSelectedOptions={handleOnChangeTags}
      disabled={disabled}
      label={label}
      displayName={displayName}
      initialValue={initialTagValue}
      onValidate={validateTagName}
      maxValueLength={TAG_NAME_MAX_LENGTH}
      multipleValueValidationRegExp={NormalTagNameInputRegExp}
      singleValueValidationRegExp={NormalSingleTagNameInputRegExp}
      nameField="name"
      canInputNewValues
      useInitialValue
      slotProps={{
        Chip: {
          sx: {
            color: theme.palette.text.secondary,
            marginBottom: '8px !important',
            background: theme.palette.background.tagEditor.tag,
          },
        },
        RemoveIcon: {
          fill: theme.palette.icon.fill.default,
        },
        Li: {
          selectedBackground: theme.palette.background.participant.active,
          hoverBackgroundColor: theme.palette.background.participant.hover,
          CheckIcon: {
            fill: theme.palette.icon.fill.secondary,
          },
        },
        paper: {
          sx: {
            background: theme.palette.background.secondary,
            margin: '8px !important',
          },
        },
      }}
      {...props}
    />
  );
}
