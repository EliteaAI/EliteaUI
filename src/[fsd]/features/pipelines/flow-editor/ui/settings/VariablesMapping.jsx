import { memo } from 'react';

import { Box, useTheme } from '@mui/material';

import VariablesMappingItem from '@/[fsd]/features/pipelines/flow-editor/ui/settings/VariablesMappingItem';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';

const VariablesMapping = memo(props => {
  const { style, variables_mapping, onChangeMapping, onDeleteMapping, disabled } = props;
  const theme = useTheme();

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
      summarySX={{
        background: theme.palette.background.userInputBackground,
        borderRadius: '.5rem',
        minHeight: '2rem !important',
      }}
      titleSX={{
        color: 'text.secondary',
      }}
      accordionDetailsSX={{
        paddingLeft: '0rem',
      }}
      items={[
        {
          title: `Variables mapping(${Object.keys(variables_mapping || {}).length})`,
          content: (
            <Box>
              {Object.keys(variables_mapping || {}).map(key => (
                <VariablesMappingItem
                  key={key}
                  fieldName={key}
                  fieldValue={variables_mapping[key]}
                  onChangeMapping={onChangeMapping}
                  onDeleteMapping={onDeleteMapping}
                  disabled={disabled}
                />
              ))}
            </Box>
          ),
        },
      ]}
    />
  );
});

VariablesMapping.displayName = 'VariablesMapping';

export default VariablesMapping;
