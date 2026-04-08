import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import BasicAccordion from '../[fsd]/shared/ui/accordion/BasicAccordion';
import VariableList from './VariableList';

const ApplicationVariables = memo(props => {
  const { style } = props;

  const { values: { version_details = {} } = {}, setFieldValue } = useFormikContext();

  const onChangeVariable = useCallback(
    (label, newValue) => {
      const updateIndex = version_details?.variables?.findIndex(variable => variable.name === label);
      const currentVariable = version_details?.variables?.[updateIndex];

      if (currentVariable?.value === newValue) return;

      setFieldValue(
        `version_details.variables`,
        version_details?.variables?.map((v, index) =>
          index === updateIndex ? { ...v, value: newValue } : v,
        ),
      );
    },
    [setFieldValue, version_details?.variables],
  );

  const accordionItems = useMemo(
    () => [
      {
        title: 'Variables',
        content: (
          <Box>
            <VariableList
              variables={version_details?.variables}
              onChangeVariable={onChangeVariable}
              showexpandicon="true"
              multiline
              collapseContent
            />
          </Box>
        ),
      },
    ],
    [version_details?.variables, onChangeVariable],
  );

  const styles = applicationVariablesStyles();

  return version_details?.variables?.length > 0 ? (
    <BasicAccordion
      accordionSX={styles.accordion}
      style={style}
      items={accordionItems}
    />
  ) : null;
});

ApplicationVariables.displayName = 'ApplicationVariables';

/** @type {MuiSx} */
const applicationVariablesStyles = () => ({
  accordion: ({ palette }) => ({
    background: `${palette.background.tabPanel} !important`,
  }),
});

export default ApplicationVariables;
