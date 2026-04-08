import React, { useCallback, useEffect, useMemo } from 'react';

import { Typography } from '@mui/material';

import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion.jsx';
import { useToolkitView } from '@/hooks/toolkit/useToolkitView.js';
import { datasourceToolOptions } from '@/pages/Applications/Components/Tools/toolOptions.js';
import { useTheme } from '@emotion/react';

import DatasourceSelect from '../DatasourceSelect.jsx';
import useSelectedToolOptions from './useSelectedToolOptions.js';

export default function ToolDatasource({
  editToolDetail = {},
  editField = () => {},
  toolErrors = {},
  setToolErrors = () => {},
  showValidation = false,
  schema,
}) {
  const { settings = {} } = editToolDetail;
  const { selected_tools, datasource_id } = settings;

  const theme = useTheme();
  const { isToolkitsPage } = useToolkitView();
  const isAccordionView = useMemo(() => isToolkitsPage, [isToolkitsPage]);

  useEffect(() => {
    setToolErrors(prevState => ({
      ...prevState,
      datasource: !datasource_id,
      selected_tools: selected_tools?.length < 1,
    }));
  }, [setToolErrors, datasource_id, selected_tools?.length]);

  const onChangeDatasource = useCallback(
    datasource => {
      editField('name', datasource.label);
      editField('description', datasource.description);
      editField('settings.datasource_id', datasource.value);
    },
    [editField],
  );
  const selectedToolsOptions = useSelectedToolOptions({ schema, defaultToolOptions: datasourceToolOptions });

  const toolBaseConfiguration = (
    <DatasourceSelect
      required
      onValueChange={onChangeDatasource}
      value={datasource_id}
      error={showValidation && toolErrors.datasource}
      helperText={showValidation && toolErrors.datasource && 'Field is required'}
    />
  );

  return (
    <>
      {isAccordionView ? (
        <>
          <BasicAccordion
            // style={style}
            showMode={AccordionConstants.AccordionShowMode.LeftMode}
            accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
            items={[
              {
                title: 'Configuration',
                content: toolBaseConfiguration,
              },
            ]}
          />
        </>
      ) : (
        <>{toolBaseConfiguration}</>
      )}

      <ToolkitForm.ToolActionsSelector
        availableTools={selectedToolsOptions}
        selectedTools={settings.selected_tools}
        onChange={value => editField('settings.selected_tools', value)}
      />
      {showValidation && toolErrors.selected_tools && (
        <Typography
          marginLeft={'40px'}
          marginTop={'8px'}
          color="error"
        >
          At least one tool must be selected
        </Typography>
      )}
    </>
  );
}
