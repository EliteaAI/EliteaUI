import { memo } from 'react';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { useTheme } from '@emotion/react';

import OpenAPIActionsTable from './OpenAPIActionsTable.jsx';

const OpenAPIActions = memo(props => {
  const {
    // New props for interactive mode
    tools,
    selectedTools,
    onSelectionChange,
    disabled,
    // Legacy prop for backward compatibility
    selected_tools,
    sx,
  } = props;

  const theme = useTheme();
  const styles = openAPIActionsStyles(sx);

  return (
    <Box sx={styles.container}>
      <BasicAccordion
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        accordionSX={{
          background: `${theme.palette.background.tabPanel} !important`,
        }}
        summarySX={{
          '& .MuiAccordionSummary-content': { alignItems: 'center', paddingRight: 0 },
          paddingRight: '0 !important',
        }}
        items={[
          {
            title: 'Api Endpoints',
            content: (
              <OpenAPIActionsTable
                tools={tools}
                selectedTools={selectedTools}
                onSelectionChange={onSelectionChange}
                disabled={disabled}
                selected_tools={selected_tools}
              />
            ),
          },
        ]}
      />
    </Box>
  );
});

OpenAPIActions.displayName = 'OpenAPIActions';

/** @type {MuiSx} */
const openAPIActionsStyles = sx => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '0.5rem',
    ...sx,
  },
});

export default OpenAPIActions;
