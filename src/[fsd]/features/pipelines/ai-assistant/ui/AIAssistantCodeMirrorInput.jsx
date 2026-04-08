import { memo } from 'react';

import { Box } from '@mui/material';

import { useCodeMirrorFStringAutocomplete } from '@/[fsd]/features/pipelines/ai-assistant/lib/hooks';
import { FStringAutocompletePopper } from '@/[fsd]/features/pipelines/fstring-autocomplete/ui';
import { Field } from '@/[fsd]/shared/ui';

const AIAssistantCodeMirrorInput = memo(props => {
  const {
    editorRef,
    value,
    extensions,
    notifyChange,
    readOnly = false,
    onBlur,
    onKeyDown,
    enableFStringAutocomplete = false,
    stateVariableOptions = [],
  } = props;

  const { mergedExtensions, popperProps } = useCodeMirrorFStringAutocomplete({
    editorRef,
    extensions,
    notifyChange,
    enableFStringAutocomplete,
    readOnly,
    stateVariableOptions,
  });

  return (
    <Box sx={aiAssistantCodeMirrorInputStyles.container}>
      <Field.CodeMirrorEditor
        readOnly={readOnly}
        ref={editorRef}
        value={value}
        extensions={mergedExtensions}
        notifyChange={notifyChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {enableFStringAutocomplete && <FStringAutocompletePopper {...popperProps} />}
    </Box>
  );
});

AIAssistantCodeMirrorInput.displayName = 'AIAssistantCodeMirrorInput';

/** @type {MuiSx} */
const aiAssistantCodeMirrorInputStyles = {
  container: {
    height: '100%',
    position: 'relative',
  },
};

export default AIAssistantCodeMirrorInput;
