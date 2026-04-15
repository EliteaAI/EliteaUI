import { Form, Formik } from 'formik';

import { Grid } from '@mui/material';

import CreateAgentForm from '@/[fsd]/features/agent/ui/agent-details/configurations/form/CreateAgentForm';
import StyledTabs from '@/components/StyledTabs';
import { StyledGridContainer } from '@/pages/Common/Components';

import getValidateSchema from './Components/Applications/ApplicationCreationValidateSchema';
import CreateApplicationTabBar from './Components/Applications/CreateApplicationTabBar';
import { useCreateApplicationInitialValues } from './useApplicationInitialValues';

export default function CreateApplication() {
  const { initialValues } = useCreateApplicationInitialValues();

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={getValidateSchema}
      onSubmit={() => {}}
    >
      <StyledTabs
        fullWidth
        tabSX={{ paddingX: '24px' }}
        tabs={[
          {
            label: 'New Agent',
            tabBarItems: <CreateApplicationTabBar />,
            rightToolbar: <div />,
            content: (
              <Form style={{ height: '100%' }}>
                <StyledGridContainer
                  columnSpacing={'32px'}
                  container
                >
                  <Grid
                    size={{ xs: 12 }}
                    sx={theme => ({
                      [theme.breakpoints.up('lg')]: {
                        overflowY: 'scroll',
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        height: '100%',
                        '::-webkit-scrollbar': {
                          display: 'none',
                        },
                      },
                      [theme.breakpoints.down('lg')]: {
                        marginBottom: '24px',
                      },
                    })}
                  >
                    <CreateAgentForm />
                  </Grid>
                </StyledGridContainer>
              </Form>
            ),
          },
        ]}
      />
    </Formik>
  );
}
