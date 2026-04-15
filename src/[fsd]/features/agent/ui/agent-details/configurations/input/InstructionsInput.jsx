import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { useInstructionsInputRefContext } from '@/[fsd]/app/providers';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { FileReaderEnhancer } from '@/[fsd]/shared/ui/input';
import { contextResolver } from '@/common/utils';
import { useTheme } from '@emotion/react';

const InstructionsInput = memo(({ style, containerStyle, disabled }) => {
  const theme = useTheme();
  const inputRef = useInstructionsInputRefContext();
  const {
    values: { version_details },
    setFieldValue,
  } = useFormikContext();
  const handleChange = useCallback(field => value => setFieldValue(field, value), [setFieldValue]);

  const updateVariableList = useCallback(
    value => {
      const resolvedInputValue = contextResolver(value);
      setFieldValue(
        'version_details.variables',
        resolvedInputValue.map(key => {
          const prevValue = (version_details?.variables || []).find(v => v.name === key);
          return {
            name: key,
            value: prevValue?.value || '',
            id: prevValue?.id || undefined,
          };
        }),
      );
    },
    [setFieldValue, version_details?.variables],
  );

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
      items={[
        {
          title: 'Instructions',
          content: (
            <Box sx={containerStyle}>
              <FileReaderEnhancer
                ref={inputRef}
                showexpandicon="true"
                id="application-instructions"
                placeholder="Guidelines for the AI agent"
                defaultValue={version_details?.instructions}
                onChange={handleChange('version_details.instructions')}
                updateVariableList={updateVariableList}
                key={version_details?.id}
                multiline
                disabled={disabled}
                fieldName={'Instructions'}
              />
            </Box>
          ),
        },
      ]}
    />
  );
});

InstructionsInput.displayName = 'InstructionsInput';

export default InstructionsInput;
